// C6 Bank checking account statement (PDF exported from the app).
//
// One block per month, with its own totals:
//   "Agosto 2026" / "( 01/08/2026 - 31/08/2026 )" / "Entradas:" / "R$ 21.157,08" / "•" / "Saídas:" / "R$ 21.007,08"
// then rows of posting date, accounting date, type, description (wraps), signed amount:
//   "05/08" / "05/08" / "Entrada PIX" / "Pix recebido de NOVA COOP ... DE" / "NEGOCIOS E SERVICOS" / "R$ 21.007,08"
import { AMOUNT, buildEntry, parseBRL, round2, scan } from "../importing/statementUtils";

const ROWS = new RegExp(
  [
    String.raw`^\( \d{2}\/\d{2}\/(?<periodYear>\d{4}) - \d{2}\/\d{2}\/\d{4} \)$`,
    String.raw`^(?<day>\d{2})\/(?<month>\d{2})\n\d{2}\/\d{2}\n(?<type>[^\n]+)\n(?<desc>(?:(?![-−]?R\$ )[^\n]+\n){1,3}?)(?<amount>[-−]?R\$ ${AMOUNT})$`,
  ].join("|"),
  "gm"
);

const MONTH_TOTALS = new RegExp(String.raw`^Entradas:\nR\$ (${AMOUNT})\n•\nSaídas:\nR\$ (${AMOUNT})$`, "gm");

export default {
  kind: "checking",
  id: "c6-checking",
  name: "C6 Bank",
  logo: "/c6_logo.png",

  detect: (text) => /^Extrato exportado no dia /m.test(text) && /C6 Bank/.test(text),

  parse(text) {
    const holder = text.match(/^Extrato exportado no dia [^\n]+\n([^\n]+)$/m)?.[1] || null;

    const transactions = scan(text, ROWS, (g, state) => {
      if (g.periodYear) {
        state.year = g.periodYear;
        return null;
      }
      const description = g.desc.replace(/\n/g, " ").trim();
      const counterparty = description.match(/^Pix (?:recebido de|enviado para) (.+)$/i)?.[1];

      return buildEntry({
        date: state.year ? `${state.year}-${g.month}-${g.day}` : null,
        description: counterparty || description,
        memo: counterparty ? g.type : null,
        amount: parseBRL(g.amount),
        counterparty,
        holder,
      });
    });

    const months = [...text.matchAll(MONTH_TOTALS)];
    return {
      holder,
      expected: months.length
        ? {
            in: round2(months.reduce((s, m) => s + parseBRL(m[1]), 0)),
            out: round2(months.reduce((s, m) => s + parseBRL(m[2]), 0)),
          }
        : {},
      transactions,
    };
  },
};
