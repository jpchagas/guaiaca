/**
 * Banks a transaction can come from, keyed by the id stored in
 * `transactions.bank` and `cards.bank`. Statement parsers use the same ids
 * (checking parsers add "-checking"; see bankIdOf).
 */
export const BANKS = {
  btg: { name: "BTG Pactual", logo: "/btg_logo.png" },
  nubank: { name: "Nubank", logo: "/nubank_logo.png" },
  c6: { name: "C6 Bank", logo: "/c6_logo.png" },
  bradesco: { name: "Bradesco", logo: "/bradesco_logo.png" },
  banrisul: { name: "Banrisul", logo: "/banrisul_logo.png" },
  itau: { name: "Itaú", logo: "/itau_logo.png" },
  caixa: { name: "Caixa", logo: "/caixa_logo.png" },
  other: { name: "Outro banco", logo: null },
};

/** "nubank-checking" → "nubank" */
export const bankIdOf = (parserId) => (parserId ? parserId.replace(/-checking$/, "") : null);

export const bankInfo = (id) => BANKS[id] || BANKS.other;

/** The card's name for card purchases, else the bank's; null when unknown. */
export function sourceLabel(tx, cardsById = {}) {
  if (tx.cardId && cardsById[tx.cardId]) return cardsById[tx.cardId].name;
  return BANKS[tx.bank]?.name || null;
}
