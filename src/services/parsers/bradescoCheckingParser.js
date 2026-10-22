// Bradesco checking account statement — PDF from "Bradesco Celular" or the CSV export.
//
// PDF rows: date (omitted when it repeats), description, optional detail,
// document number, amount, balance:
//   "08/09/2026" / "PIX RECEBIDO" / "REM: Joao Pedro Chagas 07/09" / "1418595" / "1.414,26" / "1.414,80"
//   "GASTOS CARTAO DE CREDITO" / "3990253" / "1.414,26" / "0,55"
// The credit and debit columns look identical in the text, so the direction
// comes from how the running balance moves.
//
// CSV rows: "10/09/2026;GASTOS CARTAO DE CREDITO;3990253; ;1.414,26;0,55"
import {
  AMOUNT,
  buildEntry,
  fromBRDate,
  parseBRL,
  round2,
  scan,
} from "../importing/statementUtils";

const DATE = String.raw`\d{2}\/\d{2}\/\d{4}`;

const PDF_ROWS = new RegExp(
  String.raw`^(?:(?<date>${DATE})\n)?(?<desc>(?:(?!${AMOUNT}$|\d+$|${DATE}$|Total$)[^\n]+\n){1,3}?)(?:(?<doc>\d+)\n)?(?<amount>${AMOUNT})\n(?<balance>-?${AMOUNT})$`,
  "gm"
);

const CSV_HEADER = /^\uFEFF?Extrato de: Ag: \d+ \| Conta: [\d-]+;/;
const CSV_ROW = new RegExp(
  String.raw`^(?<date>${DATE});(?<desc>[^;]*);(?<doc>\d*);(?<credit>${AMOUNT}| ?);(?<debit>${AMOUNT}| ?);(?<balance>-?${AMOUNT})$`
);

const MONEY_IN = /RECEBID|RENTAB|DEP[OÓ]SITO|SAL[AÁ]RIO|ESTORNO|RESGATE/i;

function parsePdf(text) {
  const holder = text.match(/^Nome: (.+)$/m)?.[1] || null;

  const transactions = scan(text, PDF_ROWS, (g, state) => {
    if (g.date) state.date = g.date;
    const amount = parseBRL(g.amount);
    const balance = parseBRL(g.balance);
    const previous = state.balance;
    state.balance = balance;

    // The first row ("COD. LANC. 0", 0,00) carries the opening balance
    if (amount === 0) return null;

    const [description, ...details] = g.desc.trim().split("\n");
    const credit = previous == null ? MONEY_IN.test(description) : round2(balance - previous) > 0;

    const counterparty = details
      .map((d) => d.match(/^(?:REM|DES|FAV): (.+?)(?: \d{2}\/\d{2})?$/)?.[1])
      .find(Boolean);

    return buildEntry({
      date: fromBRDate(state.date || ""),
      description,
      amount,
      credit,
      counterparty,
      holder,
    });
  });

  // "Total" / credits / debits / final balance
  const totals = text.match(new RegExp(String.raw`^Total\n(${AMOUNT})\n(${AMOUNT})\n-?${AMOUNT}$`, "m"));

  return {
    holder,
    period: text.match(/Movimentação entre: (\S+) e (\S+)/)?.slice(1).map(fromBRDate) || null,
    expected: totals ? { in: parseBRL(totals[1]), out: parseBRL(totals[2]) } : {},
    transactions,
  };
}

function parseCsv(text) {
  const transactions = [];
  let opening = null;
  let closing = null;

  // Only the first block; the export appends an unrelated "Últimos Lancamentos" table
  for (const line of text.split(/\r?\n/).slice(2)) {
    const g = line.match(CSV_ROW)?.groups;
    if (!g) break;

    const credit = g.credit.trim() ? parseBRL(g.credit) : 0;
    const debit = g.debit.trim() ? parseBRL(g.debit) : 0;
    const balance = parseBRL(g.balance);
    if (opening == null) opening = round2(balance - credit + debit);
    closing = balance;

    const entry = buildEntry({
      date: fromBRDate(g.date),
      description: g.desc,
      amount: credit || -debit,
    });
    if (entry) transactions.push(entry);
  }

  return {
    holder: null,
    expected: opening != null ? { net: round2(closing - opening) } : {},
    transactions,
  };
}

export default {
  kind: "checking",
  id: "bradesco-checking",
  name: "Bradesco",
  logo: "/bradesco_logo.png",

  detect: (text) =>
    (/^Bradesco Celular$/m.test(text) && /Extrato de: Agência/.test(text)) || CSV_HEADER.test(text),

  parse: (text) => (CSV_HEADER.test(text) ? parseCsv(text) : parsePdf(text)),
};
