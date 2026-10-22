// Banrisul credit card statement (PDF).
//
// After "HISTÓRICO DE TRANSAÇÕES", one section per card with the holder's
// first name only:
//   "JOAO - NR. 3744"
// followed by rows of date, description, amount:
//   "10/01" / "VELOE BARUERI BRA" / "189,68"
import {
  AMOUNT,
  buildTransaction,
  parseBRL,
  resolveDate,
  scanSections,
  splitInstallment,
  sumAmounts,
  toISODate,
  toRef,
} from "../importing/statementUtils";

const ROWS = new RegExp(
  [
    String.raw`^(?<holder>[A-ZÀ-Ý][A-ZÀ-Ý ]*?) - NR\. (?<last4>\d{4})$`,
    String.raw`^(?<day>\d{2})\/(?<month>\d{2})\n(?<desc>[^\n]+)\n(?<amount>-?${AMOUNT})$`,
  ].join("|"),
  "gm"
);

export default {
  kind: "credit_card",
  id: "banrisul",
  name: "Banrisul",
  logo: "/banrisul_logo.png",

  detect: (text) => /92\.702\.067\/0001-96|BANRISUL S\.A/i.test(text),

  parse(text) {
    // "Vencimento: 10/02/2026"
    const due = text.match(/Vencimento:? ?\n?(\d{2})\/(\d{2})\/(\d{4})/);
    const ref = due ? toRef(due[2], due[3]) : null;

    const start = text.search(/^HISTÓRICO DE TRANSAÇÕES$/m);
    const body = start >= 0 ? text.slice(start) : text;

    const transactions = scanSections(body, ROWS, (g, section) => {
      const { description, installment } = splitInstallment(g.desc, /\s+(?:PARC(?:ELA)?\.?\s*)?(\d{1,2})\/(\d{1,2})$/i);
      return buildTransaction({
        date: resolveDate(g.day, g.month, ref),
        description,
        amount: parseBRL(g.amount),
        installment,
        section,
      });
    });

    return {
      dueDate: due ? toISODate(due[1], due[2], due[3]) : null,
      total: sumAmounts(body, new RegExp(String.raw`^TOTAL DE GASTOS\n(${AMOUNT})$`, "gm")),
      transactions,
    };
  },
};
