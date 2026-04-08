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

- Create month filter
- Add limit of accounts creation
- Add Type list creation

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

🧾 Guaiaca Project — Progress Summary (Updated v6)

Date: 2026-04-07
Phase: Multi-account stabilization + UX upgrade + real-time balance layer + cross-account financial engine

🔥 NEW: UX & Data Evolution (Today)
1. 📱 Account & Date Switchers — Mobile-Native (Major UX Upgrade)

✅ Implemented

Replaced MUI Menu with bottom sheet (Drawer) for both AccountSwitcher and DateSwitcher
Fully mobile-friendly interaction
Clear separation between:
Trigger (top bar / ContextHeader)
Selection UI (bottom sheet)

🆕 Improvements

Tap → opens sheet (native feel)
Smooth selection with active state
“Create Account” integrated into flow
Controlled state via DashboardLayout
(no internal state in switchers → predictable behavior)

🎯 Result

✅ Feels like a real fintech app
✅ Better usability on mobile
✅ Scalable UI for future upgrades (avatars, balances, etc.)
✅ No more disconnected click issues
2. ➕ Create Account Flow — Proper Modal

✅ Implemented

New CreateAccountDialog.jsx
Name input + validation
Loading + error handling
Clean success callback

🆕 Architecture Change

Before: AccountSwitcher → directly creates account ❌
Now: AccountSwitcher → triggers dialog → dialog handles creation → returns ID ✅

🎯 Result

✅ Clean separation of concerns
✅ Reusable creation flow
✅ Ready for future fields (currency, type, etc.)
3. ❗ CRITICAL FIX — Data Model Consistency (Completed)

🚨 Root Issue (Fully Eliminated)

Previously mixed data shapes:
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

Normalized Transaction Model
{
  amount: number,
  classification: "revenue" | "expense" | "investment",
  date: ISO string,
  accountId: string
}
Centralized Balance Calculation: computeBalance(transactions)
Returns:
{
  income,
  expenses,
  investments,
  balance
}
Real-Time Sync: onSnapshot → transactions → computeBalance()

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
Date normalization: new Date(date).toISOString()

🎯 Result

✅ All data compatible with UI
✅ Safe for analytics & charts
✅ Future-proof for scaling
6. 💰 Cross-Account Balance Engine (NEW TODAY)

🚨 Evolution

Before: Balance computed per page (local scope) ❌
Now: Global, real-time, multi-account balance engine ✅

✅ Implemented (AccountContext Upgrade)

Added global state:
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

Single Firestore listener: where("accountId", "in", accountIds)
Transactions grouped by account
Balance computed in real-time
Stored in context (global access)

📱 Account Switcher Integration

Displays:
Current account balance (in trigger)
All account balances (in drawer)
Color-coded financial state (green/red)

🎯 Result

✅ True multi-account financial awareness
✅ No need to recompute balances per component
✅ Instant UI updates across the app
✅ App now feels like a real banking product
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
⚠️ Remaining Known Issues
🔴 High Priority
Data Integrity: Old corrupted transactions may exist
Validation Layer: No schema enforcement (Zod/Yup missing)
Balance Duplication: Overview recomputes balance locally → should use balancesByAccountId[currentAccountId]
🟡 Medium Priority
Accounts: Rename, Delete, Roles
Transactions: Edit flow, Sorting, Pagination
Members: Remove member, Role system
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

❌ Real-time balances scoped per page
→ ✅ Centralized financial engine powering entire app

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
Batch writes
🔵 Priority 4 — UI Polish
Account cards (balances + colors)
Micro-interactions
Dark mode refinement
💬 Final Note (Important)

What you solved across these iterations:

Data inconsistency across ingestion + UI
Real-time derived state (balances)
Cross-account aggregation
Mobile UX patterns (bottom sheet + modal flow)

✅ Solid mid-to-senior frontend architecture problems solved

Next move:

Unify balance usage across the app:
balancesByAccountId[currentAccountId]
Once done → true single financial source of truth ✅