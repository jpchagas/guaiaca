// BTG Pactual checking account statement (PDF).
//
// Rows: date and time, BTG's category, transaction type (which wraps, and on
// joint accounts names who made it), counterparty, signed amount:
//   "22/09/2026 11h53" / "Outra Categoria" / "Pix enviado por Rafaela" /
//   "Koefender De Castro Menezes" / "Oliveira" / "Lapachelle Obstetricia" / "-R$ 400,00"
// "Saldo Diário" rows are end-of-day balances. They can't be used to check the
// rows: the account's daily yield moves the balance without being listed.
import { AMOUNT, buildEntry, cleanText, fromBRDate, parseBRL, scan } from "../importing/statementUtils";

const ROWS = new RegExp(
  String.raw`^(?<date>\d{2}\/\d{2}\/\d{4}) \d{2}h\d{2}\n(?!Saldo Diário\n)(?<category>[^\n]+)\n(?<middle>(?:(?![-−]?R\$ )[^\n]+\n){1,6}?)(?<amount>[-−]?R\$ ${AMOUNT})$`,
  "gm"
);

export default {
  kind: "checking",
  id: "btg-checking",
  name: "BTG Pactual",
  logo: "/btg_logo.png",

  detect: (text) => /extrato da sua conta corrente BTG Pactual/i.test(text),

  parse(text) {
    // "22/09/2026 a 21/10/2026" / "Joao Pedro Chagas"
    const header = text.match(/^(\d{2}\/\d{2}\/\d{4}) a (\d{2}\/\d{2}\/\d{4})\n([^\n]+)$/m);
    const owner = header?.[3] || null;

    const transactions = scan(text, ROWS, (g) => {
      const parts = g.middle.trim().split("\n");
      // The last item is the counterparty unless the type is all there is
      const counterparty = parts.length > 1 ? parts.pop() : null;
      const type = cleanText(parts.join(" "));
      const actor = type.match(/^(.+?) por (.+)$/);

      return buildEntry({
        date: fromBRDate(g.date),
        description: counterparty || type,
        memo: actor ? actor[1] : type,
        amount: parseBRL(g.amount),
        counterparty,
        holder: actor ? actor[2] : owner,
        bankCategory: g.category,
      });
    });

    return {
      holder: owner,
      period: header ? [fromBRDate(header[1]), fromBRDate(header[2])] : null,
      expected: {},
      transactions,
    };
  },
};
