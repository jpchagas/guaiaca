import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  serverTimestamp,
  Timestamp,
  updateDoc,
} from "firebase/firestore";

import { auth, db } from "../../firebaseConfig";

/**
 * Goal: { accountId, title, type, targetAmount, currentAmount, contributions[] }
 * `currentAmount` is what was already saved when the goal was created;
 * progress is that plus the sum of `contributions` (signed: deposits > 0,
 * withdrawals < 0). See getGoalBalance in utils/goalTypes.js.
 */

export function createGoal({ accountId, title, type, targetAmount, currentAmount = 0 }) {
  return addDoc(collection(db, "goals"), {
    accountId,
    title,
    type,
    targetAmount,
    currentAmount,
    contributions: [],
    createdAt: serverTimestamp(),
  });
}

export function updateGoal(goalId, { title, type, targetAmount, currentAmount }) {
  return updateDoc(doc(db, "goals", goalId), { title, type, targetAmount, currentAmount });
}

export function deleteGoal(goalId) {
  return deleteDoc(doc(db, "goals", goalId));
}

export function addContribution(goalId, { amount, note }) {
  return updateDoc(doc(db, "goals", goalId), {
    // serverTimestamp() isn't allowed inside arrays
    contributions: arrayUnion({
      id: crypto.randomUUID(),
      amount,
      note: note || "",
      date: Timestamp.now(),
      by: auth.currentUser?.uid || null,
    }),
  });
}

/** `contribution` must be the exact object stored on the goal. */
export function removeContribution(goalId, contribution) {
  return updateDoc(doc(db, "goals", goalId), {
    contributions: arrayRemove(contribution),
  });
}
