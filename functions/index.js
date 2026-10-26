// Guaiaca notifications.
//
// Every notification is written to users/{uid}/notifications (the in-app bell)
// and pushed through FCM to the tokens in users/{uid}.fcmTokens.
//
//  - notifyNewTransaction: a member adds a transaction → the other members
//  - notifyImport:         a member imports a statement (accounts.lastImport
//                          changes) → one summary for the other members
//  - checkBudget:          an expense moves a category past its budget's
//                          alertAt % or 100% → every member, once per level/month
//  - remindRecurringBills: daily; a recurring bill with no matching expense
//                          this month, 2 days before and on/after its due day
//                          → every member, once per level/month
import { initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore, Timestamp } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";
import { onDocumentCreated, onDocumentUpdated, onDocumentWritten } from "firebase-functions/firestore";
import { setGlobalOptions } from "firebase-functions/options";
import { onSchedule } from "firebase-functions/scheduler";
import { logger } from "firebase-functions";

// Firestore is in nam5, whose triggers run in us-central1
setGlobalOptions({ region: "us-central1", maxInstances: 10 });

initializeApp();
const db = getFirestore();

const APP_URL = "https://guaiaca-cd777.web.app";
const TIME_ZONE = "America/Sao_Paulo";
const DEFAULT_ALERT_AT = 80;

const CLASSIFICATION = {
  revenue: "uma receita",
  expense: "uma despesa",
  investment: "um investimento",
};

const brl = (value) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value) || 0);

const firstName = (user) => (user?.name || user?.email?.split("@")[0] || "Alguém").trim().split(/\s+/)[0];

async function getUser(uid) {
  if (!uid) return null;
  const snap = await db.doc(`users/${uid}`).get();
  return snap.exists ? snap.data() : null;
}

/** Writes the in-app notification and pushes it to each recipient's devices. */
async function notify(uids, { type, title, body, link, accountId }) {
  await Promise.all(
    [...new Set(uids)].filter(Boolean).map(async (uid) => {
      const userRef = db.doc(`users/${uid}`);

      await userRef.collection("notifications").add({
        type,
        title,
        body,
        link,
        accountId,
        read: false,
        createdAt: FieldValue.serverTimestamp(),
      });

      const tokens = (await userRef.get()).data()?.fcmTokens || [];
      if (!tokens.length) return;

      const res = await getMessaging().sendEachForMulticast({
        tokens,
        notification: { title, body },
        webpush: {
          notification: { icon: `${APP_URL}/192_file.png`, tag: `${type}-${accountId}` },
          fcmOptions: { link: `${APP_URL}${link}` },
        },
      });

      // Forget tokens of uninstalled apps / revoked permissions
      const stale = res.responses
        .map((r, i) => (!r.success && /registration-token-not-registered|invalid-argument|invalid-registration-token/.test(r.error?.code || "") ? tokens[i] : null))
        .filter(Boolean);
      if (stale.length) await userRef.update({ fcmTokens: FieldValue.arrayRemove(...stale) });
    })
  );
}

/* -------------------- New transaction -------------------- */

export const notifyNewTransaction = onDocumentCreated("transactions/{txId}", async (event) => {
  const tx = event.data?.data();
  // Imports are summarized once by notifyImport; legacy writes have no author
  if (!tx || tx.import || !tx.createdBy || !tx.accountId) return;

  const account = (await db.doc(`accounts/${tx.accountId}`).get()).data();
  const recipients = (account?.members || []).filter((uid) => uid !== tx.createdBy);
  if (!recipients.length) return;

  const author = await getUser(tx.createdBy);
  await notify(recipients, {
    type: "transaction",
    accountId: tx.accountId,
    title: `${firstName(author)} adicionou ${CLASSIFICATION[tx.classification] || "uma transação"}`,
    body: `${tx.description || "Sem descrição"} · ${brl(tx.amount)} · ${account.name || "Conta"}`,
    link: "/dashboard/transactions",
  });
});

/* -------------------- Statement import -------------------- */

export const notifyImport = onDocumentUpdated("accounts/{accountId}", async (event) => {
  const before = event.data.before.data()?.lastImport;
  const after = event.data.after.data()?.lastImport;
  if (!after?.batchId || after.batchId === before?.batchId) return;

  const account = event.data.after.data();
  const recipients = (account.members || []).filter((uid) => uid !== after.by);
  if (!recipients.length) return;

  const author = await getUser(after.by);
  const what = after.kind === "credit_card" ? "da fatura" : "do extrato";
  await notify(recipients, {
    type: "import",
    accountId: event.params.accountId,
    title: `${firstName(author)} importou ${after.count} ${after.count === 1 ? "transação" : "transações"}`,
    body: `${what[0].toUpperCase()}${what.slice(1)} ${after.bank} · ${account.name || "Conta"}`,
    link: "/dashboard/transactions",
  });
});

/* -------------------- Budget thresholds -------------------- */

const monthParts = new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE, year: "numeric", month: "2-digit" });
const monthName = new Intl.DateTimeFormat("pt-BR", { timeZone: TIME_ZONE, month: "long" });

export const checkBudget = onDocumentWritten("transactions/{txId}", async (event) => {
  const tx = event.data?.after?.data();
  // Deletes and non-expenses only ever lower spending
  if (!tx || tx.classification !== "expense" || !tx.category || !tx.accountId) return;
  if (!(tx.date instanceof Timestamp)) return;

  // Skip edits that can't change any budget's total
  const prev = event.data.before?.data();
  if (prev && prev.amount === tx.amount && prev.category === tx.category && prev.date?.isEqual?.(tx.date) && prev.classification === tx.classification) return;

  const budgets = await db
    .collection("budgets")
    .where("accountId", "==", tx.accountId)
    .where("category", "==", tx.category)
    .get();
  if (budgets.empty) return;

  // Transactions are stored at local noon, so UTC month bounds are safe
  const [year, month] = monthParts.format(tx.date.toDate()).split("-").map(Number);
  const monthKey = `${year}-${String(month).padStart(2, "0")}`;
  const start = Timestamp.fromDate(new Date(Date.UTC(year, month - 1, 1)));
  const end = Timestamp.fromDate(new Date(Date.UTC(year, month, 1)));

  // Needs the (accountId, category, date) index in firestore.indexes.json
  const spentSnap = await db
    .collection("transactions")
    .where("accountId", "==", tx.accountId)
    .where("category", "==", tx.category)
    .where("date", ">=", start)
    .where("date", "<", end)
    .get();
  const spent = spentSnap.docs
    .filter((d) => d.data().classification === "expense")
    .reduce((s, d) => s + (Number(d.data().amount) || 0), 0);

  for (const budgetDoc of budgets.docs) {
    const budget = budgetDoc.data();
    const limit = Number(budget.limit) || 0;
    if (!limit) continue;

    const percent = (spent / limit) * 100;
    const levels = [budget.alertAt || DEFAULT_ALERT_AT, 100].filter((l) => percent >= l);
    if (!levels.length) continue;

    // Concurrent writes (e.g. an import) race here; the transaction makes
    // sure each level is announced once per month
    const newLevel = await db.runTransaction(async (t) => {
      const fresh = (await t.get(budgetDoc.ref)).data() || {};
      const sent = fresh.alertsSent?.[monthKey] || [];
      const pending = levels.filter((l) => !sent.includes(l));
      if (!pending.length) return null;
      t.update(budgetDoc.ref, { [`alertsSent.${monthKey}`]: [...sent, ...pending] });
      return Math.max(...pending);
    });
    if (!newLevel) continue;

    const [account, category] = await Promise.all([
      db.doc(`accounts/${tx.accountId}`).get().then((s) => s.data()),
      db.doc(`categories/${tx.category}`).get().then((s) => s.data()),
    ]);
    const name = category?.name || "categoria";
    const over = spent - limit;

    await notify(account?.members || [], {
      type: "budget",
      accountId: tx.accountId,
      title: newLevel >= 100
        ? `Orçamento de ${name} estourado`
        : `Orçamento de ${name}: ${Math.round(percent)}% usado`,
      body: newLevel >= 100
        ? `${brl(spent)} de ${brl(limit)} em ${monthName.format(tx.date.toDate())}${over > 0 ? ` (+${brl(over)})` : ""}`
        : `${brl(spent)} de ${brl(limit)} em ${monthName.format(tx.date.toDate())} · restam ${brl(limit - spent)}`,
      link: "/dashboard/budget",
    });
    logger.info("Budget alert", { budget: budgetDoc.id, monthKey, level: newLevel, spent });
  }
});

/* -------------------- Recurring bills -------------------- */

// Same rules as src/services/recurring/recurringBillService.js; keep in sync
const AMOUNT_TOLERANCE = 0.1;
const REMIND_DAYS_BEFORE = 2;

const dayParts = new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" });

const normalizeText = (s) =>
  (s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

/** billId → the expense that pays it, or null. A transaction pays at most one bill. */
function matchBills(bills, transactions) {
  const pool = transactions.filter((t) => t.classification === "expense");
  const used = new Set();
  const result = {};

  [...bills]
    .sort((a, b) => Number(!a.keyword) - Number(!b.keyword))
    .forEach((bill) => {
      const keyword = normalizeText(bill.keyword);
      const amount = Number(bill.amount) || 0;
      const candidates = pool
        .filter((t) => {
          if (used.has(t.id)) return false;
          if (keyword) return normalizeText(`${t.description} ${t.import?.counterparty || ""}`).includes(keyword);
          return t.category === bill.category && Math.abs((Number(t.amount) || 0) - amount) <= amount * AMOUNT_TOLERANCE;
        })
        .sort((a, b) => Math.abs(a.amount - amount) - Math.abs(b.amount - amount));
      const match = candidates[0] || null;
      if (match) used.add(match.id);
      result[bill.id] = match;
    });

  return result;
}

/** The daily check, exported so it can be run against the emulator. */
export async function remindBills(now = new Date()) {
  const [year, month, day] = dayParts.format(now).split("-").map(Number);
  const monthKey = `${year}-${String(month).padStart(2, "0")}`;
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();

  const byAccount = {};
  (await db.collection("recurringBills").get()).docs.forEach((d) => {
    const bill = { id: d.id, ref: d.ref, ...d.data() };
    if (bill.accountId) (byAccount[bill.accountId] = byAccount[bill.accountId] || []).push(bill);
  });

  for (const [accountId, bills] of Object.entries(byAccount)) {
    const due = bills
      .map((bill) => {
        const dueDay = Math.min(Number(bill.dueDay) || 1, lastDay);
        const days = dueDay - day;
        const level = days <= 0 ? "due" : days <= REMIND_DAYS_BEFORE ? "before" : null;
        return { bill, dueDay, days, level };
      })
      .filter(({ bill, level }) =>
        level && !bill.paid?.[monthKey] && !(bill.alertsSent?.[monthKey] || []).includes(level)
      );
    if (!due.length) continue;

    // Transactions are stored at local noon, so UTC month bounds are safe.
    // Needs the (accountId, date) index in firestore.indexes.json
    const txSnap = await db
      .collection("transactions")
      .where("accountId", "==", accountId)
      .where("date", ">=", Timestamp.fromDate(new Date(Date.UTC(year, month - 1, 1))))
      .where("date", "<", Timestamp.fromDate(new Date(Date.UTC(year, month, 1))))
      .get();
    const matches = matchBills(bills, txSnap.docs.map((d) => ({ id: d.id, ...d.data() })));

    const account = (await db.doc(`accounts/${accountId}`).get()).data();
    if (!account) continue;

    for (const { bill, dueDay, days, level } of due) {
      if (matches[bill.id]) continue;

      // Overlapping runs must not announce the same level twice
      const claimed = await db.runTransaction(async (t) => {
        const fresh = (await t.get(bill.ref)).data();
        const sent = fresh?.alertsSent?.[monthKey] || [];
        if (!fresh || fresh.paid?.[monthKey] || sent.includes(level)) return false;
        t.update(bill.ref, { [`alertsSent.${monthKey}`]: [...sent, level] });
        return true;
      });
      if (!claimed) continue;

      await notify(account.members || [], {
        type: "bill",
        accountId,
        title:
          days > 0
            ? `${bill.name} vence em ${days} ${days === 1 ? "dia" : "dias"}`
            : days === 0
            ? `${bill.name} vence hoje`
            : `${bill.name} está atrasada`,
        body: `${brl(bill.amount)} · dia ${dueDay} · o pagamento ainda não apareceu nas transações de ${account.name || "Conta"}`,
        link: "/dashboard/budget",
      });
      logger.info("Bill reminder", { bill: bill.id, monthKey, level });
    }
  }
}

export const remindRecurringBills = onSchedule(
  { schedule: "every day 09:00", timeZone: TIME_ZONE },
  () => remindBills()
);
