import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  Timestamp,
  updateDoc,
} from "firebase/firestore";

import { db } from "../../firebaseConfig";

function buildLocalDate(dateString) {
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

  return await updateDoc(
    doc(db, "transactions", transactionId),
    payload
  );
}