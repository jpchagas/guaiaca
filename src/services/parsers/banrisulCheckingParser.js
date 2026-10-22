// Banrisul checking account statement (PDF, mainframe-style "PARA SIMPLES CONFERENCIA").
//
// Between "MOVIMENTOS DA CONTA CORRENTE" and "EXTRATO EMITIDO", a month header
// is followed by rows of day (omitted when it repeats), description, document,
// amount (a trailing "-" means a debit), optional counterparty, and a running
// balance:
//   "MOVIMENTOS SET/2026"
//   "10" / "PIX" / "911844" / "63,90-" / "NOME:" / "JOAO PEDRO CHAGAS" / "SALDO" / "NA DATA" / "26,10"
import { AMOUNT, buildEntry, parseBRL, round2, scan } from "../importing/statementUtils";

const ROWS = new RegExp(
  [
    String.raw`^MOVIMENTOS (?<month>[A-Z]{3})\/(?<year>\d{4})$`,
    String.raw`^SALDO\n(?:NA DATA|ANT EM [\d/]+)\n(?<balance>${AMOUNT}-?)$`,
    String.raw`^(?:(?<day>\d{1,2})\n)?(?<desc>(?:(?!\d+$|${AMOUNT}-?$|SALDO$|NOME:$)[^\n]+\n){1,3}?)(?:\d+\n)?(?<amount>${AMOUNT}-?)(?:\nNOME:\n(?<counterparty>[^\n]+))?$`,
  ].join("|"),
  "gm"
);

const MONTHS = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];

export default {
  kind: "checking",
  id: "banrisul-checking",
  name: "Banrisul",
  logo: "/banrisul_logo.png",

  detect: (text) => /MOVIMENTOS DA CONTA CORRENTE/.test(text) && /0800 646 1515/.test(text),

  parse(text) {
    const holder = text.match(/^NOME\.*:\n(.+)$/m)?.[1] || null;
    const start = text.indexOf("MOVIMENTOS DA CONTA CORRENTE");
    const end = text.indexOf("EXTRATO EMITIDO");
    const body = text.slice(start, end > start ? end : undefined);

    const balances = [];
    const transactions = scan(body, ROWS, (g, state) => {
      if (g.month) {
        state.month = String(MONTHS.indexOf(g.month) + 1).padStart(2, "0");
        state.year = g.year;
        return null;
      }
      if (g.balance) {
        balances.push(parseBRL(g.balance));
        return null;
      }
      if (g.day) state.day = g.day.padStart(2, "0");

      return buildEntry({
        date: state.year && state.day ? `${state.year}-${state.month}-${state.day}` : null,
        description: g.desc.replace(/\n/g, " "),
        amount: parseBRL(g.amount),
        counterparty: g.counterparty,
        holder,
      });
    });

    // Opening balance ("SALDO ANT EM") to the last "SALDO NA DATA"
    return {
      holder,
      expected: balances.length > 1 ? { net: round2(balances.at(-1) - balances[0]) } : {},
      transactions,
    };
  },
};
