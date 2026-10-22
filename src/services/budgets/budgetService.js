import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";

import { db } from "../../firebaseConfig";

/**
 * Budget: { accountId, category, limit, period: "monthly", alertAt }
 * `alertAt` is the % of the limit that triggers a heads-up notification
 * (100% always notifies). Notifications already sent are recorded by the
 * Cloud Function in `alertsSent: { "YYYY-MM": [80, 100] }`.
 */

export const DEFAULT_ALERT_AT = 80;

/** Whether the account already has a budget for this category (ignoring `exceptId`). */
export async function budgetExists({ accountId, category, exceptId }) {
  const snap = await getDocs(
    query(collection(db, "budgets"), where("accountId", "==", accountId), where("category", "==", category))
  );
  return snap.docs.some((d) => d.id !== exceptId);
}

export function createBudget({ accountId, category, limit, alertAt }) {
  return addDoc(collection(db, "budgets"), {
    accountId,
    category,
    limit,
    alertAt,
    period: "monthly",
    createdAt: serverTimestamp(),
  });
}

export function updateBudget(budgetId, { category, limit, alertAt }) {
  return updateDoc(doc(db, "budgets", budgetId), { category, limit, alertAt });
}

export function deleteBudget(budgetId) {
  return deleteDoc(doc(db, "budgets", budgetId));
}
