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
- Account that i'm should be owner look like i'm not a owner

Add role system (owner / editor / viewer)
If you want, the next step is to update AccountMembersBar to include a Leave / Remove button for each member and use a reusable ConfirmActionDialog instead of window.confirm.

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

🧾 Guaiaca Project — Progress Summary (Updated v8)

Date: 2026-04-17
Phase: Multi-account stabilization + UX upgrade + real-time balance layer + cross-account financial engine + multi-user collaboration + account context reliability

🔥 NEW: Account Context Stabilization (Today)
6. 🔄 AccountContext — Selection & Sync Fix

✅ Implemented

Problem

currentAccount was out of sync
UI showed:
“No account”
“Select or create an account”
Account switch didn’t reflect across pages

Root Cause

Async state update issue:
currentAccountId updated
BUT account was computed using stale state
Missing single source of truth
🛠 Fix Applied

1. Single Source of Truth

const currentAccount =
  accounts.find((acc) => acc.id === currentAccountId) || null;

✔ Removed duplicated account state dependency issues
✔ Derived instead of manually syncing

2. Deterministic Selection Logic

const selectedId =
  accountsData.find((acc) => acc.id === currentAccountId)?.id ||
  accountsData.find((acc) => acc.id === storedId)?.id ||
  accountsData[0]?.id ||
  null;

✔ Guarantees a valid account
✔ Handles:

First login
Refresh
Account deletion

3. Immediate Sync (Critical Fix)

setCurrentAccountId(selectedId);

✔ No stale reads
✔ Fixes AccountSwitcher + ContextHeader instantly

4. Members Listener Bound to Selected Account

✔ Members now:

Update when switching account
Always reflect correct account context

5. Transactions Listener Stabilized

✔ Uses full account list
✔ Guards:

Empty accounts
Firestore in limit (10)
🎯 Result

✅ AccountSwitcher works reliably
✅ ContextHeader always shows correct account
✅ Overview & Transactions load correctly
✅ No more “No account” ghost state
✅ State is predictable and deterministic

🔥 NEW: Collaboration & Account Sharing
1. 👥 Account Membership System

✅ Implemented

Accounts now support multiple users:

accounts: {
  ownerId,
  members: [userId]
}

users: {
  accounts: [accountId]
}
🆕 Capabilities

Owner can:

Share account
Remove members

Members can:

Access shared account
Leave account

🎯 Result

✅ Multi-user financial accounts
✅ Shared finance use cases (couples, teams)
✅ Foundation for roles & permissions

2. ➕ Share Account Flow

✅ Implemented (ShareAccountDialog)

Email-based user lookup
Adds:
user → account.members
account → user.accounts
Owner-only restriction (UI-level)

🎯 Result

✅ Clean, real-world sharing flow
✅ Bi-directional data consistency

3. 👥 Members UI (AccountMembersBar)

✅ Implemented

Avatar chips with:
👑 Owner indicator
“(You)” label
Inline actions:
Remove member (owner)
Leave account (member)

🎯 Result

✅ Clear collaboration UX
✅ Permission-aware interface

4. ❗ Remove / Leave Flow

✅ Implemented

Unified logic:

Owner → removes others
Member → removes self (leave)

With confirmation dialog (ConfirmActionDialog)

🎯 Result

✅ Safe destructive actions
✅ Reusable confirmation pattern

5. 🧠 AccountContext — Collaboration Upgrade

🆕 Added

account (current full object)
members (resolved user data)

⚙️ Behavior

Real-time members listener
Syncs when account changes
Integrated into global context

🎯 Result

✅ Members available across app
✅ Real-time collaboration state

📱 Account & Date Switchers — Mobile-Native

✅ Implemented

Bottom sheet (Drawer) replaces MUI Menu
Controlled via DashboardLayout

🎯 Result

✅ Native mobile feel
✅ Predictable state management
✅ Scalable UI

➕ Create Account Flow — Modal Architecture

✅ Implemented

Dedicated CreateAccountDialog
Validation + loading + success callback

🎯 Result

✅ Clean separation of concerns
✅ Reusable creation logic

❗ Data Model Consistency (Critical Fix)

✅ Fixed

Unified:

accountId: string

Across:

Manual transactions
File ingestion
Queries

🎯 Result

✅ No silent failures
✅ Firestore queries stable
✅ UI consistency

💰 Real-Time Balance Layer (Derived Model)

✅ Implemented

{
  amount,
  classification,
  date,
  accountId
}

Central computation:

computeBalance(transactions)

🎯 Result

✅ Real-time Overview updates
✅ Single source of truth
✅ No duplicated logic

🔄 Ingestion Layer — Fixed & Aligned

✅ Updated

Removed householdId
Enforced accountId
Auto-classification
Date normalization

🎯 Result

✅ Clean data pipeline
✅ Analytics-ready data

💰 Cross-Account Balance Engine

✅ Implemented

balancesByAccountId = {
  [accountId]: {
    income,
    expenses,
    investments,
    balance
  }
}

⚙️ Behavior

Single transactions listener
Grouped per account
Real-time updates

🎯 Result

✅ Multi-account awareness
✅ Centralized financial engine
✅ Instant UI sync

🏦 Account System (UPDATED)

✅ Working

Account creation (modal)
Account switching (bottom sheet)
Persistent selection
Real-time sync

🆕 Added

Multi-user accounts
Member management
Real-time member resolution

🎯 Ready for

Roles & permissions
Account settings (advanced)
Multi-currency
💰 Transactions System (UPDATED)

✅ Working

Real-time fetching
Deletion
File ingestion

🆕 Upgrade

Feeds global balance engine
Fully normalized
Cross-account compatible

⚠️ Pending

Edit transaction
Pagination
Grouping
📊 Overview (UPDATED)

✅ Working

Real-time balances (global engine)
Category pie chart
Filters (month/year)

🆕 Added

Members bar
Share account flow
Remove/leave flow

🎯 Result

✅ Financial + collaboration dashboard
✅ Real-time + multi-user aware

⚙️ Settings (UPDATED)

✅ Working

Account info display
Members list (read-only)

🎯 Result

✅ Basic account visibility
✅ Foundation for admin features

⚠️ Remaining Known Issues
🔴 High Priority
Firestore security rules missing
Non-atomic writes (share/remove)
Old corrupted transactions
No schema validation (Zod/Yup)
🟡 Medium Priority
Member roles & permissions
Account rename/delete
Transaction editing
Members >10 limitation (Firestore in)
🟢 Low Priority
UI polish
Micro-interactions
Dark mode refinement
🧠 Architecture Status (UPDATED)

✅ Strong (Production-Level Direction)

Context-driven state
Real-time Firestore architecture

Clean separation:

Context
Layout
Pages
Services

🆕 New Layers

Derived financial engine
Cross-account aggregation
Multi-user collaboration layer
Stable account selection layer
🔥 Biggest Achievement

❌ Single-user financial tracker
→ ✅ Multi-account, real-time, collaborative financial platform

🚀 Updated Roadmap
🔴 Priority 1 — Data Integrity & Security
Firestore rules
Validation layer (Zod)
Remove duplicate logic
🟡 Priority 2 — Collaboration & Core UX
Member roles & permissions
Edit transaction
Account management
🟢 Priority 3 — Performance
Pagination
Query optimization
Batch writes
🔵 Priority 4 — UI Polish
Account cards
Micro-interactions
Visual refinements
💬 Final Note

Across these iterations, you solved:

Data consistency across ingestion + UI
Real-time derived financial state
Cross-account aggregation
Mobile-native UX patterns
Multi-user collaboration system
State synchronization issues in AccountContext

✅ You now have a stable, scalable fintech architecture with real-time collaboration and reliable account state