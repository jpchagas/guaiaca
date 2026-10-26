import {
  collection,
  deleteField,
  doc,
  serverTimestamp,
  Timestamp,
  updateDoc,
  writeBatch,
} from "firebase/firestore";

import { auth, db } from "../../firebaseConfig";
import { bankIdOf } from "../../utils/banks";
import { isSplitAccount, isSplitIncome, planIncomeSplit } from "../split/incomeShare";
import {
  DestinationError,
  addIncomePairWrites,
  monthOf,
  personalPartId,
  rebalanceIncomeShares,
  resolveDestination,
  sharedPartId,
} from "../split/sharedIncomeService";

export function buildLocalDate(dateString) {
  const [y, m, d] = dateString
    .split("-")
    .map(Number);

  return new Date(y, m - 1, d, 12);
}

function buildTransactionPayload({
  formData,
  currentAccountId,
  includeCreatedAt = false,
}) {
  const amount = Math.abs(
    Number(formData.amount)
  );

  const localDate = buildLocalDate(
    formData.date
  );

  const payload = {
    description: formData.description,
    amount,
    category: formData.category,
    classification:
      formData.classification,
    method: formData.method,
    responsibleUserId:
      formData.responsibleUserId,
    accountId: currentAccountId,
    date: Timestamp.fromDate(localDate),
  };

  // Where the money moved: the card for card purchases, the bank otherwise
  if (formData.method === "credit_card" && formData.cardId) {
    payload.cardId = formData.cardId;
  }
  if (formData.method !== "cash" && formData.bank) {
    payload.bank = formData.bank;
  }

  if (includeCreatedAt) {
    payload.createdAt = serverTimestamp();
    // Lets notifications skip the person who added it
    payload.createdBy = auth.currentUser?.uid || null;
  }

  if (formData.installmentsEnabled) {
    payload.installment = {
      current: Number(
        formData.installmentsCurrent
      ),
      total: Number(
        formData.installmentsTotal
      ),
    };
  }

  return payload;
}

// Optional fields an edit must delete explicitly, since writes merge
const OPTIONAL_FIELDS = ["installment", "cardId", "bank"];

/** Whether an income sent to `dest` is split with the earner's personal account. */
function splitsIncome(dest, { classification, category, responsibleUserId }, categoriesById) {
  return (
    !!dest.splitAccount &&
    isSplitIncome(classification, categoriesById[category]) &&
    (dest.splitAccount.members || []).includes(responsibleUserId)
  );
}

/** Re-splits each month an income change touched; a failure here is fixed by the next change. */
async function rebalanceAll(affected, transactions) {
  const seen = new Set();
  for (const { account, date } of affected) {
    const m = monthOf(date);
    const key = `${account?.id}|${m?.year}|${m?.month}`;
    if (!isSplitAccount(account) || !m || seen.has(key)) continue;
    seen.add(key);
    await rebalanceIncomeShares({ account, transactions, ...m }).catch(console.error);
  }
}

/**
 * Saves the manual form: creates, or edits `initialData`. `ctx` is
 * { currentAccount, accounts, members, transactions, categoriesById }.
 * `formData.target` says where it goes (see resolveDestination in
 * split/sharedIncomeService.js); an earning sent to an account that splits
 * per person is saved as a shared part and a personal part.
 */
export async function saveTransaction({ formData, initialData = null, ctx }) {
  const { accounts = [], transactions = [], categoriesById = {} } = ctx;
  const isEdit = !!initialData;
  const dest = resolveDestination({ ...ctx, target: formData.target, responsibleUserId: formData.responsibleUserId });

  // Editing either part of a split income edits the pair, anchored on the shared part
  const id = isEdit ? sharedPartId(initialData) : doc(collection(db, "transactions")).id;
  const pairId = personalPartId(id);

  const payload = buildTransactionPayload({ formData, currentAccountId: dest.accountId, includeCreatedAt: !isEdit });
  if (isEdit) {
    OPTIONAL_FIELDS.forEach((field) => {
      if (!payload[field]) payload[field] = deleteField();
    });
  }

  const batch = writeBatch(db);
  let saved;

  if (splitsIncome(dest, formData, categoriesById)) {
    if (!dest.personalAccountId) throw new DestinationError("noPersonalAccount");
    const { pct } = planIncomeSplit({
      account: dest.splitAccount,
      responsibleUserId: formData.responsibleUserId,
      amount: payload.amount,
      date: payload.date,
      transactions,
      excludeIds: [id, pairId],
    });
    // eslint-disable-next-line no-unused-vars
    const { amount, accountId, ...data } = payload;
    const split = {
      gross: payload.amount,
      pct,
      sharedAccountId: dest.splitAccount.id,
      personalAccountId: dest.personalAccountId,
    };
    const { shared } = addIncomePairWrites(batch, id, { ...data, ...(isEdit && { sharedVia: deleteField() }) }, split);
    saved = { ...payload, id, accountId: split.sharedAccountId, amount: shared, incomeSplit: { ...split, part: "shared", pairId } };
  } else {
    batch.set(
      doc(db, "transactions", id),
      {
        ...payload,
        ...(dest.sharedVia ? { sharedVia: dest.sharedVia } : isEdit && { sharedVia: deleteField() }),
        ...(isEdit && { incomeSplit: deleteField() }),
      },
      { merge: true }
    );
    if (initialData?.incomeSplit) batch.delete(doc(db, "transactions", pairId));
    saved = { ...payload, id };
  }

  await batch.commit();

  const after = [...transactions.filter((t) => t.id !== id && t.id !== pairId), saved];
  await rebalanceAll(
    [
      { account: dest.splitAccount, date: payload.date },
      initialData && {
        account: accounts.find((a) => a.id === (initialData.incomeSplit?.sharedAccountId || initialData.accountId)),
        date: initialData.date,
      },
    ].filter((a) => a && (formData.classification === "revenue" || initialData?.classification === "revenue")),
    after
  );

  return id;
}

/** Deletes a transaction, and both parts of a split income. */
export async function deleteTransaction(tx, { accounts = [], transactions = [] } = {}) {
  const batch = writeBatch(db);
  batch.delete(doc(db, "transactions", tx.id));
  if (tx.incomeSplit) batch.delete(doc(db, "transactions", tx.incomeSplit.pairId));
  await batch.commit();

  if (tx.classification === "revenue") {
    const removed = [tx.id, tx.incomeSplit?.pairId];
    await rebalanceAll(
      [{ account: accounts.find((a) => a.id === (tx.incomeSplit?.sharedAccountId || tx.accountId)), date: tx.date }],
      transactions.filter((t) => !removed.includes(t.id))
    );
  }
}

// Firestore caps a batch at 500 writes; a split income takes two
const BATCH_SIZE = 200;

/**
 * Saves reviewed import drafts (see importing/importDrafts.js) under their
 * deterministic ids, then stamps the account with an import summary that a
 * Cloud Function turns into a single notification for the other members.
 * Each draft goes to its `target`, like the manual form (shared or personal);
 * card bill rows are linked to `cardId` (see cards/cardService.js).
 */
export async function createImportedTransactions({ drafts, statement, currentAccountId, cardId = null, ctx }) {
  const { transactions = [], categoriesById = {} } = ctx;
  const uid = auth.currentUser?.uid || null;
  const batchId = crypto.randomUUID();
  const bank = bankIdOf(statement.bank.id);

  // Resolve every destination first, so a missing personal account fails before anything is written
  const dests = drafts.map((d) => resolveDestination({ ...ctx, target: d.target, responsibleUserId: d.responsibleUserId }));
  // Incomes of this import count towards each other's proportional shares
  const running = [...transactions];
  const affected = [];

  for (let i = 0; i < drafts.length; i += BATCH_SIZE) {
    const batch = writeBatch(db);

    drafts.slice(i, i + BATCH_SIZE).forEach((d, j) => {
      const dest = dests[i + j];
      const payload = {
        description: d.row.description,
        amount: d.row.amount,
        category: d.category,
        classification: d.classification,
        method: d.method,
        responsibleUserId: d.responsibleUserId,
        accountId: dest.accountId,
        bank,
        date: Timestamp.fromDate(buildLocalDate(d.date)),
        createdAt: serverTimestamp(),
        createdBy: uid,
        import: {
          batchId,
          bank: statement.bank.id,
          kind: statement.kind,
          ...(d.purchaseDate && { purchaseDate: d.purchaseDate }),
          ...(d.row.counterparty && { counterparty: d.row.counterparty }),
          ...(d.row.holder && { holder: d.row.holder }),
          ...(d.row.cardLast4 && { cardLast4: d.row.cardLast4 }),
        },
      };
      if (d.row.installment) payload.installment = d.row.installment;
      if (cardId && d.method === "credit_card") payload.cardId = cardId;
      if (dest.sharedVia) payload.sharedVia = dest.sharedVia;

      if (splitsIncome(dest, d, categoriesById) && dest.personalAccountId) {
        const { pct } = planIncomeSplit({
          account: dest.splitAccount,
          responsibleUserId: d.responsibleUserId,
          amount: payload.amount,
          date: payload.date,
          transactions: running,
          excludeIds: [d.id, personalPartId(d.id)],
        });
        // eslint-disable-next-line no-unused-vars
        const { amount, accountId, ...data } = payload;
        const split = { gross: amount, pct, sharedAccountId: dest.splitAccount.id, personalAccountId: dest.personalAccountId };
        const { shared } = addIncomePairWrites(batch, d.id, data, split);
        running.push({ ...payload, id: d.id, accountId: split.sharedAccountId, amount: shared, incomeSplit: { ...split, part: "shared" } });
        affected.push({ account: dest.splitAccount, date: payload.date });
      } else {
        batch.set(doc(db, "transactions", d.id), payload);
      }
    });

    await batch.commit();
  }

  await rebalanceAll(affected, running);

  const total = drafts.reduce(
    (s, d) => s + (d.classification === "revenue" ? 0 : d.row.amount),
    0
  );

  await updateDoc(doc(db, "accounts", currentAccountId), {
    lastImport: {
      batchId,
      count: drafts.length,
      total: Math.round(total * 100) / 100,
      bank: statement.bank.name,
      kind: statement.kind,
      by: uid,
      at: serverTimestamp(),
    },
  });

  return batchId;
}
