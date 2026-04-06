# 📦 Project Name

> A brief one-liner describing what your project does.

![License](https://img.shields.io/github/license/your-username/your-repo-name)
![Build](https://img.shields.io/github/workflow/status/your-username/your-repo-name/CI)
![Version](https://img.shields.io/github/v/release/your-username/your-repo-name)

---

## 📚 Table of Contents

- [About](#about)
- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [Configuration](#configuration)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)

---

## 🧾 About

Describe what this project is, what problem it solves, and who it's for.

---

## ✨ Features

- ✅ Feature 1
- ✅ Feature 2
- ✅ Feature 3
- 🚧 Feature in development

---

## 🔧 Installation


# Clone the repo
git clone https://github.com/your-username/your-repo-name.git

# Navigate to the directory
cd your-repo-name

``` bash
```
1) Install
``` bash
npm install
```

2) Run dev server
``` bash
npm run dev
```
 3) Open http://localhost:5173

### Deployment
``` bash
npm run build
```

``` bash
npm run preview 
```

``` bash
firebase deploy --only hosting
```
(R\$ [0-9]+\,[0-9]+) (\D+) (\([0-9]\/[0-9]+\) )?([0-9]+ \w+)
 ## Features

📱 Adding a responsive dashboard layout (for finances),

💾 Creating Firestore collections (e.g. wallets, transactions, couples), or

🎨 Adding a welcome animation / Material UI loading state after login?

🌓 a light/dark mode toggle,

📱 a responsive navigation bar, or

💾 persistent storage using IndexedDB/localStorage for future finance data?

Would you like me to include a dark mode toggle or responsive navigation bar in the next step? It’s easy to integrate with Material UI’s theme system.

Would you like me to also show how to make those menu items highlight the active page (so the user knows which section is open)?

Would you like me to now add a “Dashboard Overview” page showing mock finance data (e.g. income, expenses, and a simple bar chart with MUI + Recharts)?

Would you like the FAB to slide up with animation (like a bottom sheet modal) instead of showing SpeedDialActions?

If you want, I can upgrade this even further to a bottom sheet style modal (slides from bottom like a mobile banking app) — looks super smooth and very app-like.

If you want, the next step can be to turn these dialogs into more advanced forms with inputs, validations, and file upload support — just like a real finance app.

If you want, the next step could be to make these metrics and charts dynamic, reading mock transactions from state or Firestore so it looks like a real financial dashboard.

If you want, the next step could be to integrate this table with FAB dialogs so that adding a transaction manually or via file updates the table live.

Would you like me to now update Transactions.jsx to display these seeded transactions in a Material UI DataGrid table?

If you want, I can also make the “Upload File” actually parse CSV and automatically add transactions so it’s fully functional for your PWA.

Would you like me to make it match your brand theme (green highlights, rounded card edges, etc.) so all your auth screens look unified?

Would you like me to add a bar chart below the pie showing monthly income vs expenses next? It gives a great visual trend.

🚀 Suggested Roadmap (2–3 Weeks)
Week 1
Build Transactions page (CRUD)
Unify FilterContext
Connect filters to Firestore queries
Week 2
Improve file ingestion (preview + validation)
Add pagination or infinite scroll
Add delete/edit UX polish
Week 3 (optional but powerful)
Household roles
Charts improvements (trends over time)
Dark mode 🌙

Turn selector into a modern fintech dropdown (avatars, balances, etc.)
design a fintech-style selector UI (with balances, icons, spacing system)

create an month filter on top too

the share account should be something like xepa app

instead settings should be budget

Later, you should move this logic to a global AuthContext, and let AccountContext depend on it.

Add multi-account dashboard (aggregate view)


👉 Derived balance model (stored in account)

👉 Build Edit Transaction

## Current Context

🧾 Guaiaca Project — Progress Summary (Updated v5)

Date: 2026-04-05
Phase: Multi-account stabilization + UX upgrade + real-time balance layer + cross-account financial engine

🔥 NEW: UX & Data Evolution (Today)
1. 📱 Account Switcher → Mobile-Native (Major UX Upgrade)

✅ Implemented
Replaced MUI Menu with bottom sheet (Drawer)
Fully mobile-friendly interaction
Clear separation between:
Trigger (top bar)
Selection UI (bottom sheet)

🆕 Improvements
Tap → opens sheet (native feel)
Smooth selection with active state
“Create Account” integrated into flow

🎯 Result

✅ Feels like a real fintech app
✅ Better usability on mobile
✅ Scalable UI for future upgrades (avatars, balances, etc.)

2. ➕ Create Account Flow — Proper Modal

✅ Implemented
New CreateAccountDialog.jsx
Name input + validation
Loading + error handling
Clean success callback

🆕 Architecture Change

Before:

AccountSwitcher → directly creates account ❌

Now:

AccountSwitcher → triggers dialog
Dialog → handles creation → returns ID

🎯 Result

✅ Clean separation of concerns
✅ Reusable creation flow
✅ Ready for future fields (currency, type, etc.)

3. ❗ CRITICAL FIX — Data Model Consistency (Completed)

🚨 Root Issue (Fully Eliminated)

You previously had mixed data shapes:

accountId: { id, name } ❌
accountId: "abc123" ✅

✅ Fixed Across:
Manual transaction creation
File ingestion (ingestTransactionsList)
CSV ingestion
Queries in:
Overview.jsx
Transactions.jsx

🎯 Result

✅ Firestore rules now consistently pass
✅ No silent query failures
✅ No broken UI states

4. 💰 Real-Time Balance Layer (Derived Model)

🚨 Problem Before
Transactions updated ✅
Overview did NOT reflect changes ❌

🧠 Root Cause
Inconsistent transaction shape:
Missing classification
Inconsistent date
Missing normalization

✅ Implemented Solution

1. Normalized Transaction Model
{
  amount: number,
  classification: "revenue" | "expense" | "investment",
  date: ISO string,
  accountId: string
}
2. Centralized Balance Calculation
computeBalance(transactions)

Returns:

{
  income,
  expenses,
  investments,
  balance
}
3. Real-Time Sync

onSnapshot → transactions → computeBalance()

🎯 Result

✅ Overview updates instantly
✅ Single source of truth (transactions)
✅ No duplicated balance logic (at system level)

5. 🔄 Ingestion Layer — Fixed & Aligned

✅ Updated
ingestTransactionsList.js
fileIngestion.js

🆕 Improvements
Removed householdId dependency ❌
Enforced accountId ✅

Auto-classification:
amount >= 0 → revenue
amount < 0 → expense

Date normalization:
new Date(date).toISOString()

🎯 Result

✅ All data compatible with UI
✅ Safe for analytics & charts
✅ Future-proof for scaling

🆕 6. 💰 Cross-Account Balance Engine (NEW TODAY)

🚨 Evolution

Before:
Balance computed per page (local scope) ❌

Now:
Global, real-time, multi-account balance engine ✅

✅ Implemented (AccountContext Upgrade)

Added new global state:

transactions
balancesByAccountId
🧠 Core Model
balancesByAccountId = {
  [accountId]: {
    income,
    expenses,
    investments,
    balance
  }
}
⚙️ How It Works
Single Firestore listener:
where("accountId", "in", accountIds)
Transactions grouped by account
Balance computed in real-time
Stored in context (global access)
📱 Account Switcher Integration (Major UX Leap)

Now displays:

Current account balance (in trigger)
All account balances (in drawer)
Color-coded financial state:
positive → green
negative → red
🎯 Result

✅ True multi-account financial awareness
✅ No need to recompute balances per component
✅ Instant UI updates across the app
✅ App now feels like a real banking product

⚠️ Important Note (Next Step)

Overview.jsx still computes balance locally:

const balance = income - expenses - investments;

👉 This should be refactored to use:

balancesByAccountId[currentAccountId]
🏦 Account System (UPDATED STATUS)

✅ Fully Working
Account creation (modal-based)
Account switching (bottom sheet)
Persistent selection (localStorage)
Real-time Firestore sync

🆕 Upgrade
Real-time balances per account (global)
Mobile-native UX

🎯 Ready for:
Account cards (with balances)
Avatars
Multi-currency

💰 Transactions System (UPDATED)

✅ Working
Real-time fetching
Deletion
Filtering
File ingestion (fixed)

🆕 Upgrade
Feeds global balance engine
Fully normalized
Cross-account compatible

⚠️ Pending
Edit transaction
Pagination
Grouping (by date/category)

📊 Overview (UPDATED)

✅ Working
Real-time updates
Category pie chart
Filter support

🆕 Context

Still uses filtered transactions
Still computes balance locally ⚠️

🎯 Result

✅ Matches Transactions page
⚠️ Needs alignment with global balance engine

⚠️ Remaining Known Issues (Updated)
🔴 High Priority
Data Integrity
Old corrupted transactions may still exist
No migration yet
Validation Layer
No schema enforcement (Zod/Yup missing)

Risk:
invalid dates
string amounts

Balance Duplication ⚠️ (NEW)
Overview recomputes balance locally
Should use global derived state
🟡 Medium Priority

Accounts
Rename account
Delete account
Roles (owner/admin/member)

Transactions
Edit flow
Sorting
Pagination

Members
Remove member
Role system

🧠 Architecture Status (UPDATED)

✅ Strong (Production-Level)

Context-driven state
Firestore real-time architecture

Clean separation:
Context
Layout
Pages
Services

🆕 New Layers

Derived data model (balances from transactions)
Cross-account aggregation layer (global balances)

🔥 Biggest Achievement Today

You crossed another important line:

❌ Real-time balances but scoped per page
→
✅ Centralized financial engine powering entire app

🚀 Updated Roadmap
🔴 Priority 1 — Data Integrity & Consistency
Data validation layer (Zod)
Migration script for old transactions
Remove duplicate balance logic (Overview)
🟡 Priority 2 — Core UX
Edit transaction
Account rename/delete
Member roles
🟢 Priority 3 — Performance
Pagination (transactions)
Query optimization
Batch writes (important)
🔵 Priority 4 — UI Polish
Account cards (balances + colors)
Micro-interactions
Dark mode refinement
🧠 Final Assessment (Updated)

✅ You Now Have:

Real multi-account architecture
Correct Firestore usage
Real-time reactive UI
Clean data model
Mobile-first UX
Derived balance system
Global cross-account financial engine (NEW)
⚠️ Next Bottleneck

Not architecture anymore.

👉 It’s now:

Consistency (single source of truth) + UX refinement

💬 Final Note (Important)

What you solved across these iterations:

Data inconsistency across ingestion + UI
Real-time derived state (balances)
Cross-account aggregation
Mobile UX patterns (bottom sheet + modal flow)

These are solid mid-to-senior frontend architecture problems.

👉 Starting Point for Tomorrow

Very clear next move:

Unify balance usage across the app

→ Refactor Overview to consume:

balancesByAccountId[currentAccountId]

Once you do that:

👉 Your app will have a true single financial source of truth