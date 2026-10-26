import {
  addDoc,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import { auth, db } from "../../firebaseConfig";
import { bankInfo } from "../../utils/banks";
import { toDate } from "../../utils/format";

/**
 * Credit card ("cartão"): one card account at a bank, i.e. one monthly bill.
 * Additional and virtual cards on the same bill share it, so `last4` lists
 * every card number seen on its bills.
 *
 * { accountId, bank, name, last4: string[], ownerId,
 *   limit?, closingDay? (1–31), dueDay? (1–31) }
 *
 * Card purchases point at it through `transactions.cardId`; every
 * transaction can also carry the `bank` it came from (see utils/banks.js).
 */

export function createCard({ accountId, bank, name, last4 = [], ownerId = null, limit = null, closingDay = null, dueDay = null }) {
  return addDoc(collection(db, "cards"), {
    accountId,
    bank,
    name,
    last4,
    ownerId,
    limit,
    closingDay,
    dueDay,
    createdAt: serverTimestamp(),
    createdBy: auth.currentUser?.uid || null,
  });
}

export function updateCard(cardId, { bank, name, last4, ownerId, limit, closingDay, dueDay }) {
  return updateDoc(doc(db, "cards", cardId), { bank, name, last4, ownerId, limit, closingDay, dueDay });
}

/** Its transactions keep the dangling cardId and show up as "Cartão não identificado". */
export function deleteCard(cardId) {
  return deleteDoc(doc(db, "cards", cardId));
}

/**
 * The card an imported bill belongs to: a card of the same bank that shares
 * a card number, else one of that bank with no numbers yet (created by hand
 * or by the migration). Null means a new card is needed.
 */
export function findCardForBill(cards, bank, last4s) {
  const sameBank = cards.filter((c) => c.bank === bank);
  return (
    sameBank.find((c) => c.last4?.some((n) => last4s.includes(n))) ||
    sameBank.find((c) => !c.last4?.length) ||
    (!last4s.length && sameBank[0]) ||
    null
  );
}

/** Finds or creates the card for an imported bill, recording new card numbers; returns its id. */
export async function resolveImportCard({ cards, accountId, bank, last4s, ownerId }) {
  const card = findCardForBill(cards, bank, last4s);

  if (card) {
    const missing = last4s.filter((n) => !card.last4?.includes(n));
    if (missing.length) {
      await updateDoc(doc(db, "cards", card.id), { last4: arrayUnion(...missing) });
    }
    return card.id;
  }

  const { name } = bankInfo(bank);
  const hasSameBank = cards.some((c) => c.bank === bank);
  const ref = await createCard({
    accountId,
    bank,
    name: hasSameBank && last4s[0] ? `${name} final ${last4s[0]}` : name,
    last4: last4s,
    ownerId,
  });
  return ref.id;
}

/**
 * { year, month (0-based) } of the bill a card transaction is paid in.
 * Imported rows are already dated on the bill's due date. Manual purchases
 * use the card's closing and due days when set (a purchase after the closing
 * day goes to the next bill); otherwise the purchase month.
 */
export function billMonthOf(tx, card) {
  const d = toDate(tx.date);
  if (!d) return null;
  if (tx.import || !card?.closingDay || !card?.dueDay) {
    return { year: d.getFullYear(), month: d.getMonth() };
  }

  const closingMonth = d.getMonth() + (d.getDate() > card.closingDay ? 1 : 0);
  // Due after the closing day in the same month, or early the next month
  const due = new Date(d.getFullYear(), closingMonth + (card.dueDay > card.closingDay ? 0 : 1), 1);
  return { year: due.getFullYear(), month: due.getMonth() };
}

/** What a card bill adds up to: purchases minus refunds. */
export const billAmountOf = (tx) =>
  (tx.classification === "revenue" ? -1 : 1) * (Number(tx.amount) || 0);

/** Share of the limit (%) a bill uses → progress bar color. */
export const limitColor = (pct) => (pct >= 90 ? "error" : pct >= 70 ? "warning" : "primary");
