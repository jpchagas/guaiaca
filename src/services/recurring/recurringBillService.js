import {
  addDoc,
  collection,
  deleteDoc,
  deleteField,
  doc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import { auth, db } from "../../firebaseConfig";
import { isInMonth, toDate } from "../../utils/format";

/**
 * Recurring bill ("conta fixa"): an expense expected every month, e.g. the
 * gym paid by transfer. Nothing is generated; each month the bill counts as
 * paid when a matching transaction shows up, or when someone marks it paid.
 *
 * { accountId, name, amount, category, dueDay (1–31), keyword,
 *   paid: { "YYYY-MM": true },          // marked by hand
 *   alertsSent: { "YYYY-MM": ["before", "due"] } }  // written by remindRecurringBills
 *
 * The matching rules are duplicated in functions/index.js; keep them in sync.
 */

export const AMOUNT_TOLERANCE = 0.1;
export const REMIND_DAYS_BEFORE = 2;

export function createBill({ accountId, name, amount, category, dueDay, keyword }) {
  return addDoc(collection(db, "recurringBills"), {
    accountId,
    name,
    amount,
    category,
    dueDay,
    keyword,
    paid: {},
    createdAt: serverTimestamp(),
    createdBy: auth.currentUser?.uid || null,
  });
}

export function updateBill(billId, { name, amount, category, dueDay, keyword }) {
  return updateDoc(doc(db, "recurringBills", billId), { name, amount, category, dueDay, keyword });
}

export function deleteBill(billId) {
  return deleteDoc(doc(db, "recurringBills", billId));
}

export function setBillPaid(billId, key, paid) {
  return updateDoc(doc(db, "recurringBills", billId), {
    [`paid.${key}`]: paid ? true : deleteField(),
  });
}

/** month is 0-based, like DateContext. */
export const monthKey = (year, month) => `${year}-${String(month + 1).padStart(2, "0")}`;

/** The bill's due date in a month; day 31 falls on the last day of shorter months. */
export function dueDateIn(bill, year, month) {
  const lastDay = new Date(year, month + 1, 0).getDate();
  return new Date(year, month, Math.min(Number(bill.dueDay) || 1, lastDay), 12);
}

export const normalizeText = (s) =>
  (s || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

/**
 * Pairs each bill with the month's transaction that pays it, or null.
 * Bills with a keyword match any expense whose description (or imported
 * counterparty) contains it, whatever the amount. Bills without one match an
 * expense in the same category within AMOUNT_TOLERANCE of the amount.
 * A transaction pays at most one bill.
 */
export function matchBills(bills, transactions) {
  const pool = transactions.filter((t) => t.classification === "expense");
  const used = new Set();
  const result = {};

  const ordered = [...bills].sort((a, b) => Number(!a.keyword) - Number(!b.keyword));
  ordered.forEach((bill) => {
    const keyword = normalizeText(bill.keyword);
    const amount = Number(bill.amount) || 0;
    const candidates = pool.filter((t) => {
      if (used.has(t.id)) return false;
      if (keyword) {
        return normalizeText(`${t.description} ${t.import?.counterparty || ""}`).includes(keyword);
      }
      return t.category === bill.category && Math.abs((Number(t.amount) || 0) - amount) <= amount * AMOUNT_TOLERANCE;
    });
    // Closest amount first
    candidates.sort((a, b) => Math.abs(a.amount - amount) - Math.abs(b.amount - amount));
    const match = candidates[0] || null;
    if (match) used.add(match.id);
    result[bill.id] = match;
  });

  return result;
}

/** Whole days from `today` to the due date in that month (negative once past). */
export function daysUntilDue(bill, year, month, today = new Date()) {
  const noonToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12);
  return Math.round((dueDateIn(bill, year, month) - noonToday) / 86400000);
}

/**
 * "paid" | "upcoming" | "dueSoon" | "dueToday" | "overdue" for a month,
 * relative to `today`.
 */
export function billStatus(bill, { match, year, month, today = new Date() }) {
  if (match || bill.paid?.[monthKey(year, month)]) return "paid";

  const days = daysUntilDue(bill, year, month, today);

  if (days < 0) return "overdue";
  if (days === 0) return "dueToday";
  if (days <= REMIND_DAYS_BEFORE) return "dueSoon";
  return "upcoming";
}

/** Whether the bill already existed in that month (bills don't apply retroactively). */
export function billAppliesTo(bill, year, month) {
  const created = toDate(bill.createdAt) || new Date();
  return year > created.getFullYear() || (year === created.getFullYear() && month >= created.getMonth());
}

/** The account's expenses in a month, for matchBills. */
export function monthExpenses(transactions, accountId, year, month) {
  return transactions.filter(
    (t) => t.accountId === accountId && t.classification === "expense" && isInMonth(t.date, month, year)
  );
}
