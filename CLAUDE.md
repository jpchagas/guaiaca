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
cd functions && node scripts/migrateCategories.js --project <id> [--apply]  # Moves old categories onto the current taxonomy (dry run without --apply; needs admin credentials)
cd functions && node scripts/migrateTransactionSources.js --project <id> [--apply]  # Gives old imported rows their `bank` and links card rows to a card (same flags)
cd functions && npm install         # Cloud Functions deps (separate package, Node 22)
firebase deploy --only functions,firestore:indexes   # Notifications backend (project must be on Blaze)
firebase emulators:exec --only firestore,functions --project demo-guaiaca "node <script>"  # Exercise triggers locally (needs Java)
```

There is no test suite. Firestore security rules are in `firestore.rules` (deploy with `firebase deploy --only firestore:rules`; every collection needs a rule there) and composite indexes in `firestore.indexes.json`. `VITE_FIREBASE_VAPID_KEY` (see `.env.example`) enables web push.

## Architecture

**Provider tree** (`src/main.jsx`): `ThemeProvider` → `DateProvider` → `AccountProvider` → `App`. `AccountProvider` depends on `useDate()`, so the order matters.

**Auth/routing** (`src/App.jsx`): `onAuthStateChanged` gates routes; `/dashboard/*` is nested under `DashboardLayout` (bottom nav, account/date switchers, context-aware FAB) with child routes Overview, Transactions, Cards, Budget, Goals. Pages are lazy-loaded. `Settings.jsx` and `JoinAccount.jsx` exist but are not routed.

**AccountContext** (`src/context/AccountContext.jsx`) is the core state hub:
- Listens to `accounts` where `members array-contains uid`; `currentAccount` (derived from `currentAccountId`, persisted in `localStorage.currentAccountId`) is the single source of truth for which account the UI shows.
- Listens to `users` for the current account's members and to `transactions` across all the user's accounts.
- Computes `balancesByAccountId` (income/expenses/investments/balance) for the month/year selected in `DateContext`. Balances are always derived from transactions — never stored.
- Firestore `in` queries are capped at 10 IDs (`slice(0, 10)`), so only the first 10 accounts/members are covered.

Pages (Transactions, Budget, Goals), `RecurringBillsSection` and `useCards` also open their own `onSnapshot` listeners scoped by `where("accountId", "==", currentAccount.id)`. Every financial document carries `accountId`; new collections should follow that pattern.

**Firestore collections**:
- `accounts`: `ownerId`, `members[]`, `type`, `split` (`{ mode: "equal" | "proportional" | "fixed" | "joint", shares? }`, computed by `services/split/computeSplit.js`; `"joint"`, "Conta única", pools everything with no settlement), and `lastImport` (summary of the latest statement import).
- `users`: `email`, `accounts[]`, `fcmTokens[]`, `personalAccountId` (set at signup, backfilled by `AccountContext` on login; how a partner reaches this user's personal account), plus a `notifications` subcollection written by Cloud Functions.
- `transactions`: `createdBy` (the author, used to skip them in notifications), `bank` (where the money moved, an id from `utils/banks.js`), `cardId` on card purchases, `import: { batchId, bank, kind, purchaseDate?, cardLast4?, … }` on imported rows (`import.bank` is the parser id, e.g. `nubank-checking`), `incomeSplit` on the two parts of a split income, and `sharedVia` on rows written into a partner's personal account (see below).
- `cards`: one per card bill: `bank`, `name`, `last4[]` (every card number seen on its bills, additional and virtual ones included), `ownerId`, optional `limit`, `closingDay`, `dueDay`. Imports find or create the card with `resolveImportCard` (`services/cards/cardService.js`), matched by bank and card number. The Cartões page (`pages/Cards.jsx`) groups card purchases by bill month with `billMonthOf`: imported rows are already on the due date; manual ones use the card's closing and due days.
- `budgets`: `alertAt` (%, default 80) and `alertsSent: { "YYYY-MM": [80, 100] }`, which only the functions write.
- `goals`: `currentAmount` is the starting amount, and progress is `getGoalBalance()` = that + the signed `contributions[]` array.
- `recurringBills` ("contas fixas"): `name`, `amount`, `category`, `dueDay`, optional `keyword`, `paid: { "YYYY-MM": true }` (marked by hand) and `alertsSent`, which only the functions write. A bill is paid in a month when an expense matches it (keyword in the description or counterparty; otherwise same category within ±10%) or it's marked paid. The matching lives in `src/services/recurring/recurringBillService.js` and is duplicated in `functions/index.js`. They are shown on the Orçamento page.
- `categories`: global, not account-scoped; read via `useCategories()`. The taxonomy is in `seedCategories.js`, and icons/colors are keyed by the normalized name in `utils/categoryVisuals.js`. Imported rows with no category are saved as "Outros".

Transactions and budgets store a category **document ID** in `category`, and the UI resolves the name through `useCategories()`. Goal and budget writes go through `src/services/goals/goalService.js` and `src/services/budgets/budgetService.js`.

**Notifications** (`functions/index.js`, 2nd-gen, `us-central1` because Firestore is in `nam5`):
- `notifyNewTransaction` tells the other members about a manual transaction.
- `notifyImport` sends one summary per import, triggered by `accounts.lastImport`.
- `checkBudget` alerts every member once per level per month when a category crosses `alertAt`% or 100%. A transaction on the budget doc dedupes concurrent writes.
- `remindRecurringBills` runs daily at 09:00 (São Paulo). For each unpaid recurring bill it alerts every member 2 days before the due day and again on or after it, once per level per month. The core is exported as `remindBills(now)` so it can be run against the emulator.

Each notification goes to `users/{uid}/notifications` (the bell in `DashboardLayout`, via `useNotifications`) and to FCM. On the client, `src/services/notifications/push.js` registers `public/firebase-messaging-sw.js` under its own scope, alongside the PWA service worker.

**Shared vs personal** (`services/split/incomeShare.js`, `sharedIncomeService.js`): in a shared account whose split mode isn't `"joint"`, every transaction, typed in or imported, has a destination (`target`): that shared account, or `"personal"`, meaning the responsible member's personal account (found through `users.personalAccountId`). A row for the partner is written straight into the partner's personal account with `sharedVia: <sharedAccountId>`, which the security rules check. A personal account offers the user's split accounts as destinations. An earning (category Salário or Receita de negócios) sent to a split account is saved as two documents: the shared part (`id`) and the rest in the earner's personal account (`id_p`), both with `incomeSplit: { part, pairId, gross, pct, sharedAccountId, personalAccountId }`. `pct` follows the split mode: 1/n for equal, the member's % for fixed, and the member's gross income ÷ everyone's for that month for proportional. Every save or delete of an income, and every change to the split settings, re-splits that month (`rebalanceIncomeShares`). `computeSplit` uses `gross` for incomes. Saves and deletes go through `saveTransaction` and `deleteTransaction` in `transactionService.js`, which handle the pair.

**Transactions**:
- `classification` is `"revenue" | "expense" | "investment"`; `amount` is stored as a positive number and the sign comes from classification.
- Dates are stored as Firestore `Timestamp`s at **local noon** (`buildLocalDate` in `src/services/transactions/transactionService.js`) to avoid timezone day-shifts. Readers handle both `Timestamp` (`.toDate()`) and legacy string dates.
- Optional `installment: { current, total }` applies to `credit_card` only.
- Create and edit both go through `TransactionEntryDialog` → `ManualTransactionForm` → `saveTransaction` in `transactionService.js` (edit uses `mode="edit"`).

**Statement import** (work in progress): `TransactionEntryDialog` "Import" tab → `ImportTransactionsFlow` → `src/services/importing/parseFile.js`. Handles credit card bills and checking account statements, as PDF or CSV (Bradesco and Nubank export CSV). `pdfText.js` turns a PDF into "token text" (each pdf.js text item, in content order, one per line); image-only PDFs have no text and are rejected (`scannedPdf`). `parseStatement.js` picks the parser whose `detect()` matches the content (CNPJ, legal name or layout phrases — never the filename), so detectors must stay mutually exclusive. Each parser in `src/services/parsers/` declares `kind: "credit_card" | "checking"` and is a pure regex scanner built on `importing/statementUtils.js`:
- Saving: `importDrafts.js` builds reviewable drafts with deterministic doc ids (re-importing is idempotent). Card rows are dated on the bill's due date, and the purchase date is kept in `import.purchaseDate`. Card bill payments and transfers between the holder's own accounts/members start unchecked. `suggestCategory.js` pre-fills categories from history, then keywords, then the bank's category. `createImportedTransactions` (transactionService) batch-writes the rows and stamps `accounts.lastImport`.
- Card parsers (`btgParser`, `nubankParser`, …) return `{ dueDate, total, transactions }`. Rows carry `installment` and `cardLast4`, and dates are the purchase dates, with the year inferred from the due/issue date. Bill payments and carried-over balances are dropped.
- Checking parsers (`*CheckingParser`) return `{ holder, expected, transactions }`, where `expected` is the statement's own `in`/`out`/`net` totals or balance change. Rows carry `memo`, `counterparty`, `bankCategory` and `flag: "bill_payment"`. Card bill payments are kept but flagged so they aren't double counted against imported card purchases.

All rows have `date`, positive `amount`, `type: "expense" | "credit"` and `holder`. `parseStatement` adds `totals` and a `check` against the printed totals (BTG checking has none: the account's daily yield isn't listed as rows). `matchCardholder.js` maps printed names to account members, and `isInternalTransfer` marks transfers between the holder's own accounts or members. `src/services/ingestion/ingestTransactionsList.js` and `src/utils/fileIngestion.js` are older, unused paths that don't match the current schema. Sample statements are in `data/credit_card_bill/` and `data/checking_account_statement/` (every one with printed totals should reconcile to them), and bank logos are in `public/`.

**Build**: `vite.config.js` sets up `vite-plugin-pwa` (autoUpdate; `registerSW()` is called in `main.jsx`) and manual chunks for react/mui/recharts.
