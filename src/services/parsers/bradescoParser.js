// Bradesco credit card statement ("Fatura Mensal" PDF from Bradesco Cartões).
//
// One section per card:
//   "JOAO PEDRO CHAGAS" / "Cartão" / "4066 XXXX XXXX 0021"
// followed by rows of date, description, then the city (one item per word,
// possibly none) and the amount. The installment is either at the end of the
// description or an item of its own; credits end in " -":
//   "29/08" / "ZAFFARI TOTAL" / "PORTO" / "ALEGRE" / "312,92"
//   "31/03" / "BARBARA SCHERER B" / "06/10" / "PORTO" / "ALEGRE" / "92,50"
//   "10/09" / "PAGTO. POR DEB EM C/C" / "1.414,26 -"
import {
  AMOUNT,
  buildTransaction,
  parseBRL,
  resolveDate,
  scanSections,
  splitInstallment,
  toISODate,
  toRef,
} from "../importing/statementUtils";

const ROW_AMOUNT = String.raw`${AMOUNT}(?: -)?`;

const ROWS = new RegExp(
  [
    String.raw`^(?<holder>[A-ZÀ-Ý]+(?: [A-ZÀ-Ý]+)+)\nCartão\n\d{4} X{4} X{4} (?<last4>\d{4})$`,
    String.raw`^(?<day>\d{2})\/(?<month>\d{2})\n(?<desc>[^\n]+)\n(?<extra>(?:(?!${ROW_AMOUNT}$)[^\n]+\n){0,4}?)(?<amount>${ROW_AMOUNT})$`,
  ].join("|"),
  "gm"
);

const INSTALLMENT = /^(\d{2})\/(\d{2})$/;

export default {
  kind: "credit_card",
  id: "bradesco",
  name: "Bradesco",
  logo: "/bradesco_logo.png",

  // The bank alone isn't enough: other banks' statements list Pix to "Banco Bradesco"
  detect: (text) => /Bradesco Cart[õo]es/i.test(text) && /^Total da fatura em real$/im.test(text),

  parse(text) {
    // "Vencimento" / "10/10/2026"
    const due = text.match(/^Vencimento\n(\d{2})\/(\d{2})\/(\d{4})$/m);
    const ref = due ? toRef(due[2], due[3]) : null;

    const transactions = scanSections(text, ROWS, (g, section) => {
      // A standalone "06/10" item is the installment; the other extra items are the city
      const ownLine = g.extra.split("\n").find((item) => INSTALLMENT.test(item));
      const { description, installment } = splitInstallment(
        ownLine ? `${g.desc} ${ownLine}` : g.desc,
        /\s+(\d{2})\/(\d{2})$/
      );
      return buildTransaction({
        date: resolveDate(g.day, g.month, ref),
        description,
        amount: parseBRL(g.amount),
        installment,
        section,
      });
    });

    const total = text.match(new RegExp(String.raw`^Total da fatura em real\n(${AMOUNT})$`, "im"));

    return {
      dueDate: due ? toISODate(due[1], due[2], due[3]) : null,
      total: total ? parseBRL(total[1]) : null,
      transactions,
    };
  },
};
