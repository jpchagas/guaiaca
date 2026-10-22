// Nubank credit card statement (PDF).
//
// After the "TRANSAÇÕES" header, each cardholder gets a subtotal line:
//   "Joao Pedro Chagas" / "R$ 119,92"
// followed by rows of date, optional card, description, amount:
//   "03 SET" / "•••• 5765" / "Amazon - Parcela 3/12" / "R$ 119,92"
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
    // Tried first so a row's description is never mistaken for a holder name
    String.raw`^(?<day>\d{2}) (?<month>[A-Z]{3})\n(?:•+ (?<card>\d{4})\n)?(?<desc>[^\n]+)\n(?<amount>[-−]?R\$ ${AMOUNT})$`,
    String.raw`^(?<holder>[A-Za-zÀ-ÿ' ]+)\nR\$ ${AMOUNT}$`,
  ].join("|"),
  "gm"
);

export default {
  kind: "credit_card",
  id: "nubank",
  name: "Nubank",
  logo: "/nubank_logo.png",

  // The checking statement carries the same CNPJ; the bill header tells them apart
  detect: (text) =>
    /18\.236\.120\/0001-58|Nu Pagamentos S\.A/i.test(text) && /^FATURA \d{2} [A-Z]{3} \d{4}$/m.test(text),

  parse(text) {
    // "FATURA 10 OUT 2025"
    const due = text.match(/FATURA (\d{2}) ([A-Z]{3}) (\d{4})/);
    const ref = due ? toRef(due[2], due[3]) : null;
    // Name printed on every page header, used if there's no per-card section
    const owner = text.match(/^([A-ZÀ-Ý ]+)\nFATURA \d{2}/m)?.[1] || null;

    const start = text.search(/^TRANSAÇÕES$/m);
    const body = start >= 0 ? text.slice(start) : text;

    const transactions = scanSections(body, ROWS, (g, section) => {
      const { description, installment } = splitInstallment(g.desc, /\s*-\s*Parcela (\d{1,2})\/(\d{1,2})$/i);
      return buildTransaction({
        date: resolveDate(g.day, g.month, ref),
        description,
        amount: parseBRL(g.amount),
        installment,
        section: {
          holder: section.holder || owner,
          last4: g.card || section.last4,
        },
      });
    });

    return {
      dueDate: due ? toISODate(due[1], due[2], due[3]) : null,
      total: amountAfter(text, "Total de compras de todos os cartões"),
      transactions,
    };
  },
};
