// Nubank checking account statement — PDF or the CSV export.
//
// PDF, after "Movimentações": a day header, then "Total de entradas" /
// "Total de saídas" groups whose rows are type, description (wraps), amount:
//   "09 SET 2026" / "Total de entradas" / "+ 150,00" /
//   "Transferência recebida pelo Pix" / "ROSILEI PEREIRA CHAGAS - •••.446.750-•• - Banco" / ... / "150,00"
//
// CSV: "Data,Valor,Identificador,Descrição", signed amounts with a decimal point.
import {
  AMOUNT,
  buildEntry,
  fromBRDate,
  parseBRL,
  parseMonth,
  scan,
} from "../importing/statementUtils";

const PDF_ROWS = new RegExp(
  [
    // Day and group headers are listed first so they win over a row starting at the same item
    String.raw`^(?<day>\d{2}) (?<month>[A-Z]{3}) (?<year>\d{4})$`,
    String.raw`^Total de (?<group>entradas|saídas)\n[+-] ${AMOUNT}$`,
    String.raw`^(?<type>[^\n]+)\n(?<desc>(?:(?!${AMOUNT}$)[^\n]+\n){0,4}?)(?<amount>${AMOUNT})$`,
  ].join("|"),
  "gm"
);

const CSV_HEADER = /^\uFEFF?Data,Valor,Identificador,Descrição\r?$/m;
const CSV_ROW = /^(\d{2}\/\d{2}\/\d{4}),(-?\d+(?:\.\d+)?),[^,]*,(.*)$/;

// "ROSILEI PEREIRA CHAGAS - •••.446.750-•• - Banco do Estado…" → "ROSILEI PEREIRA CHAGAS"
const counterpartyOf = (details) => details.match(/^(.+?) - [•\d.\-*]+ - /)?.[1] || null;

function parsePdf(text) {
  const holder = text.split("\n")[0] || null;

  // The page header repeats on every page and can land in the middle of a row
  const header = text.slice(0, text.indexOf("VALORES EM R$\n") + "VALORES EM R$\n".length);
  const start = text.indexOf("\nMovimentações\n") + 1;
  const end = text.indexOf("O saldo líquido corresponde");
  const body = text
    .slice(start + "Movimentações\n".length, end > start ? end : undefined)
    .split(header).join("")
    .replace(/^(Extrato gerado dia .*|\d+ de \d+)\n/gm, "");

  const transactions = scan(body, PDF_ROWS, (g, state) => {
    if (g.year) {
      state.date = `${g.year}-${String(parseMonth(g.month)).padStart(2, "0")}-${g.day}`;
      return null;
    }
    if (g.group) {
      state.credit = g.group === "entradas";
      return null;
    }
    if (state.credit == null) return null;

    const details = g.desc.replace(/\n/g, " ").trim();
    const counterparty = counterpartyOf(details);
    return buildEntry({
      date: state.date,
      description: counterparty || details || g.type,
      memo: g.type,
      amount: parseBRL(g.amount),
      credit: state.credit,
      counterparty,
      holder,
    });
  });

  // "Saldo inicial" / "Rendimento líquido" / "Total de entradas" / "Total de saídas" / "Saldo final do período", then the values
  const summary = text.match(
    new RegExp(String.raw`^Saldo final do período\n-?${AMOUNT}\n[+-]${AMOUNT}\n\+(${AMOUNT})\n-(${AMOUNT})$`, "m")
  );

  return {
    holder,
    expected: summary ? { in: parseBRL(summary[1]), out: parseBRL(summary[2]) } : {},
    transactions,
  };
}

function parseCsv(text) {
  const transactions = text
    .split(/\r?\n/)
    .map((line) => line.match(CSV_ROW))
    .filter(Boolean)
    .map(([, date, value, description]) => {
      const [type, ...rest] = description.split(" - ");
      const counterparty = counterpartyOf(rest.join(" - ") + " - ");
      return buildEntry({
        date: fromBRDate(date),
        description: counterparty || description,
        memo: counterparty ? type : null,
        amount: Number(value),
        counterparty,
      });
    })
    .filter(Boolean);

  return { holder: null, expected: {}, transactions };
}

export default {
  kind: "checking",
  id: "nubank-checking",
  name: "Nubank",
  logo: "/nubank_logo.png",

  detect: (text) =>
    CSV_HEADER.test(text) ||
    (/18\.236\.120\/0001-58/.test(text) && /^Movimentações$/m.test(text) && /Saldo final do período/.test(text)),

  parse: (text) => (CSV_HEADER.test(text) ? parseCsv(text) : parsePdf(text)),
};
