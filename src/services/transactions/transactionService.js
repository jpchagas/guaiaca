import {
  addDoc,
  collection,
  deleteField,
  doc,
  serverTimestamp,
  Timestamp,
  updateDoc,
  writeBatch,
} from "firebase/firestore";

import { auth, db } from "../../firebaseConfig";

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

export async function createTransaction({
  formData,
  currentAccountId,
}) {
  const payload = buildTransactionPayload({
    formData,
    currentAccountId,
    includeCreatedAt: true,
  });

  return await addDoc(
    collection(db, "transactions"),
    payload
  );
}

export async function updateTransactionById({
  transactionId,
  formData,
  currentAccountId,
}) {
  const payload = buildTransactionPayload({
    formData,
    currentAccountId,
  });

  // updateDoc merges fields, so a removed installment must be deleted explicitly
  if (!payload.installment) {
    payload.installment = deleteField();
  }

  return await updateDoc(
    doc(db, "transactions", transactionId),
    payload
  );
}

// Firestore caps a batch at 500 writes
const BATCH_SIZE = 450;

/**
 * Saves reviewed import drafts (see importing/importDrafts.js) under their
 * deterministic ids, then stamps the account with an import summary that a
 * Cloud Function turns into a single notification for the other members.
 */
export async function createImportedTransactions({ drafts, statement, currentAccountId }) {
  const uid = auth.currentUser?.uid || null;
  const batchId = crypto.randomUUID();

  for (let i = 0; i < drafts.length; i += BATCH_SIZE) {
    const batch = writeBatch(db);

    drafts.slice(i, i + BATCH_SIZE).forEach((d) => {
      const payload = {
        description: d.row.description,
        amount: d.row.amount,
        category: d.category,
        classification: d.classification,
        method: d.method,
        responsibleUserId: d.responsibleUserId,
        accountId: currentAccountId,
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
        },
      };
      if (d.row.installment) payload.installment = d.row.installment;

      batch.set(doc(db, "transactions", d.id), payload);
    });

    await batch.commit();
  }

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
