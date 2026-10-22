// Bradesco credit card statement (PDF exported from the Bradesco Cartões app).
//
// One section per card:
//   "JOAO PEDRO CHAGAS - VISA INFINITE"
// followed by rows of date, description, amount. Long descriptions wrap into
// an extra item, which may also hold the installment:
//   "13/08" / "ZP *ACADEMIA SOULFIT L" / "1/12" / "270,00"
//   "06/12" / "TAP WEB VIP 9/10" / "878,66"
import {
  AMOUNT,
  amountAfter,
  buildTransaction,
  parseBRL,
  resolveDate,
  scanSections,
  splitInstallment,
  toISODate,
  toRef,
} from "../importing/statementUtils";

const ROWS = new RegExp(
  [
    String.raw`^(?<holder>[A-ZÀ-Ý]+(?: [A-ZÀ-Ý]+)+) - [A-Z][A-Z ]+$`,
    String.raw`^(?<day>\d{2})\/(?<month>\d{2})\n(?<desc>(?:(?!-?${AMOUNT}$)[^\n]+\n){1,3}?)(?<amount>-?${AMOUNT})$`,
  ].join("|"),
  "gm"
);

export default {
  kind: "credit_card",
  id: "bradesco",
  name: "Bradesco",
  logo: "/bradesco_logo.png",

  detect: (text) => /Bradesco Cart[õo]es|Banco Bradesco/i.test(text),

  parse(text) {
    // The app export has no due date; "Data: 03/09/2025 - 13:59" is when it was generated
    const issued = text.match(/Data: (\d{2})\/(\d{2})\/(\d{4})/);
    const ref = issued ? toRef(issued[2], issued[3]) : null;

    const transactions = scanSections(text, ROWS, (g, section) => {
      const desc = g.desc.replace(/\n/g, " ").trim();
      const { description, installment } = splitInstallment(desc, /\s+(\d{1,2})\/(\d{1,2})$/);
      return buildTransaction({
        date: resolveDate(g.day, g.month, ref),
        description,
        amount: parseBRL(g.amount),
        installment,
        section,
      });
    });

    return {
      dueDate: null,
      issueDate: issued ? toISODate(issued[1], issued[2], issued[3]) : null,
      total: amountAfter(text, "Total da Fatura em Real"),
      transactions,
    };
  },
};
