import { doc, writeBatch } from "firebase/firestore";

import { auth, db } from "../../firebaseConfig";
import { getFirstName, isInMonth, toDate } from "../../utils/format";
import {
  grossIncomeByMember,
  incomeShareOf,
  isSplitAccount,
  splitAmounts,
} from "./incomeShare";

/**
 * Writes for personal vs shared transactions (rules in incomeShare.js).
 *
 * A split income is two documents: the shared part, which anchors the pair,
 * and `${sharedId}_p` in the earner's personal account. Both carry
 *   incomeSplit: { part: "shared" | "personal", pairId, gross, pct,
 *                  sharedAccountId, personalAccountId }
 * Documents written into a partner's personal account carry `sharedVia`
 * (the shared account both are members of), which the security rules check.
 */

export const personalPartId = (sharedId) => `${sharedId}_p`;

/** The shared part's id for either part of a split income. */
export const sharedPartId = (tx) => (tx.incomeSplit?.part === "personal" ? tx.incomeSplit.pairId : tx.id);

/** The member's personal account: from the user's own accounts, or the `personalAccountId` on a member's user doc. */
export function personalAccountOf(uid, { accounts = [], members = [] }) {
  if (uid === auth.currentUser?.uid) {
    return accounts.find((a) => a.type === "personal" && a.ownerId === uid)?.id || null;
  }
  return members.find((m) => m.id === uid)?.personalAccountId || null;
}

export class DestinationError extends Error {
  constructor(code) {
    super(code);
    this.code = code; // "noPersonalAccount"
  }
}

/**
 * Default `target` for a new transaction: the split account being viewed,
 * "personal" in a personal account, else the account itself (a joint one).
 */
export function defaultTarget(currentAccount) {
  if (isSplitAccount(currentAccount)) return currentAccount.id;
  return currentAccount?.type === "personal" ? "personal" : currentAccount?.id;
}

/** `target` of a saved transaction, for editing it. */
export function targetOf(tx, accounts = []) {
  if (tx.incomeSplit) return tx.incomeSplit.sharedAccountId;
  const account = accounts.find((a) => a.id === tx.accountId);
  return account?.type === "personal" ? "personal" : tx.accountId;
}

/**
 * Where a transaction can go from the account being viewed:
 * [{ value, label, disabled }], or [] when there's nothing to choose (a joint
 * account, or a personal account with no split account to send to).
 */
export function destinationOptions({ currentAccount, accounts = [], members = [], responsibleUserId }) {
  const owner = members.find((m) => m.id === responsibleUserId);
  const personal = {
    value: "personal",
    label:
      !owner || responsibleUserId === auth.currentUser?.uid
        ? "Pessoal"
        : `Pessoal de ${getFirstName(owner.name, owner.email)}`,
    disabled: !personalAccountOf(responsibleUserId, { accounts, members }),
  };

  if (isSplitAccount(currentAccount)) {
    return [{ value: currentAccount.id, label: currentAccount.name || "Compartilhada" }, personal];
  }
  if (currentAccount?.type === "personal") {
    const shared = accounts.filter(isSplitAccount);
    return shared.length ? [personal, ...shared.map((a) => ({ value: a.id, label: a.name || "Compartilhada" }))] : [];
  }
  return [];
}

/**
 * Where a transaction goes. `target` is a split account's id, or "personal"
 * (the responsible member's personal account). Returns
 * { accountId, splitAccount, personalAccountId, sharedVia }.
 */
export function resolveDestination({ target, responsibleUserId, currentAccount, accounts = [], members = [] }) {
  const personalAccountId = personalAccountOf(responsibleUserId, { accounts, members });

  if (target !== "personal") {
    const account = accounts.find((a) => a.id === target) || currentAccount;
    return {
      accountId: account.id,
      splitAccount: isSplitAccount(account) ? account : null,
      personalAccountId,
      sharedVia: null,
    };
  }

  if (!personalAccountId) throw new DestinationError("noPersonalAccount");
  const isOwn = accounts.some((a) => a.id === personalAccountId);
  return {
    accountId: personalAccountId,
    splitAccount: null,
    personalAccountId,
    sharedVia: isOwn ? null : currentAccount.id,
  };
}

/**
 * Adds a split income's writes to `batch`. `data` holds the fields both
 * parts share (description, category, date…); merge keeps createdAt on
 * edits. The personal part is deleted when nothing is left for it.
 */
export function addIncomePairWrites(batch, sharedId, data, { gross, pct, sharedAccountId, personalAccountId }) {
  const { shared, personal } = splitAmounts(gross, pct);
  const split = { gross, pct, sharedAccountId, personalAccountId };
  const pairRef = doc(db, "transactions", personalPartId(sharedId));

  batch.set(
    doc(db, "transactions", sharedId),
    { ...data, accountId: sharedAccountId, amount: shared, incomeSplit: { ...split, part: "shared", pairId: pairRef.id } },
    { merge: true }
  );

  if (personal > 0) {
    batch.set(
      pairRef,
      {
        ...data,
        accountId: personalAccountId,
        amount: personal,
        sharedVia: sharedAccountId,
        incomeSplit: { ...split, part: "personal", pairId: sharedId },
      },
      { merge: true }
    );
  } else {
    batch.delete(pairRef);
  }

  return { shared, personal };
}

/**
 * Re-splits the month's split incomes in `account` whose share is stale:
 * proportional shares move whenever a month's incomes change, and all of
 * them move when the split settings do. `transactions` must already
 * reflect the change that triggered it.
 */
export async function rebalanceIncomeShares({ account, transactions, year, month }) {
  if (!isSplitAccount(account)) return;

  const gross = grossIncomeByMember(transactions, account.id, year, month);
  const batch = writeBatch(db);
  let writes = 0;

  transactions
    .filter((t) => t.accountId === account.id && t.incomeSplit?.part === "shared" && isInMonth(t.date, month, year))
    .forEach((t) => {
      const pct = incomeShareOf(account, t.responsibleUserId, gross);
      if (Math.abs(pct - t.incomeSplit.pct) < 1e-9) return;
      // eslint-disable-next-line no-unused-vars
      const { id, amount, accountId, incomeSplit, ...data } = t;
      addIncomePairWrites(batch, id, data, {
        gross: incomeSplit.gross,
        pct,
        sharedAccountId: account.id,
        personalAccountId: incomeSplit.personalAccountId,
      });
      writes += 1;
    });

  if (writes) await batch.commit();
}

/** The month of a date-ish value, for rebalancing. */
export function monthOf(value) {
  const d = toDate(value);
  return d ? { year: d.getFullYear(), month: d.getMonth() } : null;
}
