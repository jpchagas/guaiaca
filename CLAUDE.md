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
```

There is no test suite. Firestore security rules are not in this repo (managed in the Firebase console).

## Architecture

**Provider tree** (`src/main.jsx`): `ThemeProvider` → `DateProvider` → `AccountProvider` → `App`. `AccountProvider` depends on `useDate()`, so the order matters.

**Auth/routing** (`src/App.jsx`): `onAuthStateChanged` gates routes; `/dashboard/*` is nested under `DashboardLayout` (bottom nav, account/date switchers, context-aware FAB) with child routes Overview, Transactions, Budget, Goals. Pages are lazy-loaded. `Settings.jsx` and `JoinAccount.jsx` exist but are not routed.

**AccountContext** (`src/context/AccountContext.jsx`) is the core state hub:
- Listens to `accounts` where `members array-contains uid`; `currentAccount` (derived from `currentAccountId`, persisted in `localStorage.currentAccountId`) is the single source of truth for which account the UI shows.
- Listens to `users` for the current account's members and to `transactions` across all the user's accounts.
- Computes `balancesByAccountId` (income/expenses/investments/balance) for the month/year selected in `DateContext`. Balances are always derived from transactions — never stored.
- Firestore `in` queries are capped at 10 IDs (`slice(0, 10)`), so only the first 10 accounts/members are covered.

Pages (Transactions, Budget, Goals) also open their own `onSnapshot` listeners scoped by `where("accountId", "==", currentAccount.id)`. Every financial document carries `accountId`; new collections should follow that pattern.

**Firestore collections**: `accounts` (`ownerId`, `members[]`, `type`), `users` (`email`, `accounts[]`), `transactions`, `budgets`, `goals`, `categories` (global, not account-scoped; read via `useCategories()`). Transactions and budgets store a category **document ID** in `category`, and the UI resolves the name through `useCategories()`.

**Transactions**:
- `classification` is `"revenue" | "expense" | "investment"`; `amount` is stored as a positive number and the sign comes from classification.
- Dates are stored as Firestore `Timestamp`s at **local noon** (`buildLocalDate` in `src/services/transactions/transactionService.js`) to avoid timezone day-shifts. Readers handle both `Timestamp` (`.toDate()`) and legacy string dates.
- Optional `installment: { current, total }` applies to `credit_card` only.
- Two write paths exist: the FAB opens `TransactionEntryDialog` → `ManualTransactionForm` (uses `transactionService.js`), while the Transactions page edits through the older `AddTransactionDialog`, which writes to Firestore directly. Keep them consistent, or consolidate onto the service.

**Statement import** (work in progress): `TransactionEntryDialog` "Import" tab → `ImportTransactionsFlow` → `src/services/importing/parseFile.js` (bank → parser registry) → `src/services/parsers/btgParser.js` (XLSX via `xlsx`, PDF via `pdfjs-dist` + regex). Only BTG is implemented, and parsed rows aren't persisted yet. `src/services/parsers/parseFile.js`, `src/services/ingestion/ingestTransactionsList.js` and `src/utils/fileIngestion.js` are older, unused paths; the ingestion one writes string dates and free-text categories, which don't match the current schema. Sample bank statements for testing parsers are in `data/`, and bank logos are in `public/`.

**Build**: `vite.config.js` sets up `vite-plugin-pwa` (autoUpdate; `registerSW()` is called in `main.jsx`) and manual chunks for react/mui/recharts.
