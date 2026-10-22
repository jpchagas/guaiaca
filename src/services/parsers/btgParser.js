// BTG Pactual credit card statement (PDF).
//
// Transactions come in content order as: amount, description, date —
//   "R$ 74,50" / "Bordados Companhia (2/2)" / "29 Ago"
// grouped under one section per card:
//   "Lançamentos do cartão físico | Joao Pedro Chagas | Final 1866"
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
    String.raw`^Lançamentos do cartão [^|\n]*\| (?<holder>[^|\n]+?) \| Final (?<last4>\d{4})`,
    String.raw`^(?<amount>[-−]?\s?R\$ ${AMOUNT})\n(?<desc>[^\n]+)\n(?<day>\d{1,2}) (?<month>[A-Za-zç]{3})$`,
  ].join("|"),
  "gm"
);

export default {
  kind: "credit_card",
  id: "btg",
  name: "BTG Pactual",
  logo: "/btg_logo.png",

  detect: (text) => /30\.306\.294\/0001-45|BTG Pactual S\.A/i.test(text),

  parse(text) {
    // "Vencimento: 07/10" + "fatura de Outubro de 2025"
    const due = text.match(/Vencimento: (\d{2})\/(\d{2})/);
    const year = text.match(/fatura de \S+ de (\d{4})/)?.[1];
    const ref = due && year ? toRef(due[2], year) : null;

    const transactions = scanSections(text, ROWS, (g, section) => {
      const { description, installment } = splitInstallment(g.desc, /\s*\((\d{1,2})\/(\d{1,2})\)$/);
      return buildTransaction({
        date: resolveDate(g.day, g.month, ref),
        description,
        amount: parseBRL(g.amount),
        installment,
        section,
      });
    });

    return {
      dueDate: due && year ? toISODate(due[1], due[2], year) : null,
      total: sumAmounts(text, new RegExp(String.raw`Total do cartão: R\$ (${AMOUNT})`, "g")),
      transactions,
    };
  },
};
