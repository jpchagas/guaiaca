// C6 Bank credit card statement (PDF).
//
// One section per card:
//   "C6 Carbon Virtual Final 8284 - JOAO PEDRO"
// followed by rows of date, one or more description items, amount:
//   "09 jun" / "DM" / "*HELPMAXCOM" / "- Parcela 3/12" / "29,90"
//   "09 ago" / "COBASI POA MOINHOS DE" / "- Estorno" / "256,41"
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
    String.raw`^C6 [^\n]*?Final (?<last4>\d{4}) - (?<holder>[^\n]+)$`,
    String.raw`^(?<day>\d{2}) (?<month>[a-zç]{3})\n(?<desc>(?:(?!${AMOUNT}$)[^\n]+\n){1,4}?)(?<amount>${AMOUNT})$`,
  ].join("|"),
  "gm"
);

const REFUND = /\s*-\s*Estorno\b/i;

export default {
  kind: "credit_card",
  id: "c6",
  name: "C6 Bank",
  logo: "/c6_logo.png",

  detect: (text) => /31\.872\.495\/0001-72|BANCO C6 S\.A/i.test(text),

  parse(text) {
    // "Vencimento:" / "10/09/2025"
    const due = text.match(/Vencimento:?\n(\d{2})\/(\d{2})\/(\d{4})/i);
    const ref = due ? toRef(due[2], due[3]) : null;

    const transactions = scanSections(text, ROWS, (g, section) => {
      let desc = g.desc.replace(/\n/g, " ");
      const credit = REFUND.test(desc);
      desc = desc.replace(REFUND, "");
      const { description, installment } = splitInstallment(desc.trim(), /\s*-\s*Parcela (\d{1,2})\/(\d{1,2})$/i);
      return buildTransaction({
        date: resolveDate(g.day, g.month, ref),
        description,
        amount: parseBRL(g.amount),
        installment,
        section,
        credit,
      });
    });

    return {
      dueDate: due ? toISODate(due[1], due[2], due[3]) : null,
      total: sumAmounts(text, new RegExp(String.raw`Subtotal deste cartão\nR\$ (${AMOUNT})`, "g")),
      transactions,
    };
  },
};
