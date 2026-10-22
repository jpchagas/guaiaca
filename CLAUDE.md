# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Guaiaca is a personal/shared finance PWA (React 19 + Vite + MUI 7, Firebase Auth + Firestore, JavaScript/JSX — no TypeScript). UI copy is mostly English; category names and bank data are Brazilian Portuguese (BRL, `R$`). The "Current Context" section of `README.md` is the author's running design snapshot (data model, known gaps, roadmap) — check it before changing the data model.

## Commands

```bash
npm run dev       # Vite dev server at http://localhost:5173
npm run build     # Production build to dist/
npm run preview   # Serve the built dist/
npm run lint      # ESLint (flat config, eslint.config.js) — currently has pre-existing errors
firebase deploy --only hosting   # Deploys dist/ to Firebase project guaiaca-cd777
node src/scripts/seedCategories.js  # Seeds the global `categories` collection (writes to the live project)
cd functions && npm install         # Cloud Functions deps (separate package, Node 22)
firebase deploy --only functions,firestore:indexes   # Notifications backend (project must be on Blaze)
firebase emulators:exec --only firestore,functions --project demo-guaiaca "node <script>"  # Exercise triggers locally (needs Java)
```

There is no test suite. Firestore security rules are not in this repo (managed in the Firebase console); composite indexes are in `firestore.indexes.json`. `VITE_FIREBASE_VAPID_KEY` (see `.env.example`) enables web push.

## Architecture

**Provider tree** (`src/main.jsx`): `ThemeProvider` → `DateProvider` → `AccountProvider` → `App`. `AccountProvider` depends on `useDate()`, so the order matters.

**Auth/routing** (`src/App.jsx`): `onAuthStateChanged` gates routes; `/dashboard/*` is nested under `DashboardLayout` (bottom nav, account/date switchers, context-aware FAB) with child routes Overview, Transactions, Budget, Goals. Pages are lazy-loaded. `Settings.jsx` and `JoinAccount.jsx` exist but are not routed.

**AccountContext** (`src/context/AccountContext.jsx`) is the core state hub:
- Listens to `accounts` where `members array-contains uid`; `currentAccount` (derived from `currentAccountId`, persisted in `localStorage.currentAccountId`) is the single source of truth for which account the UI shows.
- Listens to `users` for the current account's members and to `transactions` across all the user's accounts.
- Computes `balancesByAccountId` (income/expenses/investments/balance) for the month/year selected in `DateContext`. Balances are always derived from transactions — never stored.
- Firestore `in` queries are capped at 10 IDs (`slice(0, 10)`), so only the first 10 accounts/members are covered.

Pages (Transactions, Budget, Goals) also open their own `onSnapshot` listeners scoped by `where("accountId", "==", currentAccount.id)`. Every financial document carries `accountId`; new collections should follow that pattern.

**Firestore collections**:
- `accounts`: `ownerId`, `members[]`, `type`, `split`, and `lastImport` (summary of the latest statement import).
- `users`: `email`, `accounts[]`, `fcmTokens[]`, plus a `notifications` subcollection written by Cloud Functions.
- `transactions`: `createdBy` (the author, used to skip them in notifications), and `import: { batchId, bank, kind, purchaseDate?, … }` on imported rows.
- `budgets`: `alertAt` (%, default 80) and `alertsSent: { "YYYY-MM": [80, 100] }`, which only the functions write.
- `goals`: `currentAmount` is the starting amount, and progress is `getGoalBalance()` = that + the signed `contributions[]` array.
- `categories`: global, not account-scoped; read via `useCategories()`.

Transactions and budgets store a category **document ID** in `category`, and the UI resolves the name through `useCategories()`. Goal and budget writes go through `src/services/goals/goalService.js` and `src/services/budgets/budgetService.js`.

**Notifications** (`functions/index.js`, 2nd-gen, `us-central1` because Firestore is in `nam5`):
- `notifyNewTransaction` tells the other members about a manual transaction.
- `notifyImport` sends one summary per import, triggered by `accounts.lastImport`.
- `checkBudget` alerts every member once per level per month when a category crosses `alertAt`% or 100%. A transaction on the budget doc dedupes concurrent writes.

Each notification goes to `users/{uid}/notifications` (the bell in `DashboardLayout`, via `useNotifications`) and to FCM. On the client, `src/services/notifications/push.js` registers `public/firebase-messaging-sw.js` under its own scope, alongside the PWA service worker.

**Transactions**:
- `classification` is `"revenue" | "expense" | "investment"`; `amount` is stored as a positive number and the sign comes from classification.
- Dates are stored as Firestore `Timestamp`s at **local noon** (`buildLocalDate` in `src/services/transactions/transactionService.js`) to avoid timezone day-shifts. Readers handle both `Timestamp` (`.toDate()`) and legacy string dates.
- Optional `installment: { current, total }` applies to `credit_card` only.
- Two write paths exist: the FAB opens `TransactionEntryDialog` → `ManualTransactionForm` (uses `transactionService.js`), while the Transactions page edits through the older `AddTransactionDialog`, which writes to Firestore directly. Keep them consistent, or consolidate onto the service.

**Statement import** (work in progress): `TransactionEntryDialog` "Import" tab → `ImportTransactionsFlow` → `src/services/importing/parseFile.js`. Handles credit card bills and checking account statements, as PDF or CSV (Bradesco and Nubank export CSV). `pdfText.js` turns a PDF into "token text" (each pdf.js text item, in content order, one per line); image-only PDFs have no text and are rejected (`scannedPdf`). `parseStatement.js` picks the parser whose `detect()` matches the content (CNPJ, legal name or layout phrases — never the filename), so detectors must stay mutually exclusive. Each parser in `src/services/parsers/` declares `kind: "credit_card" | "checking"` and is a pure regex scanner built on `importing/statementUtils.js`:
- Saving: `importDrafts.js` builds reviewable drafts with deterministic doc ids (re-importing is idempotent). Card rows are dated on the bill's due date, and the purchase date is kept in `import.purchaseDate`. Card bill payments and transfers between the holder's own accounts/members start unchecked. `suggestCategory.js` pre-fills categories from history, then keywords, then the bank's category. `createImportedTransactions` (transactionService) batch-writes the rows and stamps `accounts.lastImport`.
- Card parsers (`btgParser`, `nubankParser`, …) return `{ dueDate, total, transactions }`. Rows carry `installment` and `cardLast4`, and dates are the purchase dates, with the year inferred from the due/issue date. Bill payments and carried-over balances are dropped.
- Checking parsers (`*CheckingParser`) return `{ holder, expected, transactions }`, where `expected` is the statement's own `in`/`out`/`net` totals or balance change. Rows carry `memo`, `counterparty`, `bankCategory` and `flag: "bill_payment"`. Card bill payments are kept but flagged so they aren't double counted against imported card purchases.

All rows have `date`, positive `amount`, `type: "expense" | "credit"` and `holder`. `parseStatement` adds `totals` and a `check` against the printed totals (BTG checking has none: the account's daily yield isn't listed as rows). `matchCardholder.js` maps printed names to account members, and `isInternalTransfer` marks transfers between the holder's own accounts or members. `src/services/ingestion/ingestTransactionsList.js` and `src/utils/fileIngestion.js` are older, unused paths that don't match the current schema. Sample statements are in `data/credit_card_bill/` and `data/checking_account_statement/` (every one with printed totals should reconcile to them), and bank logos are in `public/`.

**Build**: `vite.config.js` sets up `vite-plugin-pwa` (autoUpdate; `registerSW()` is called in `main.jsx`) and manual chunks for react/mui/recharts.
