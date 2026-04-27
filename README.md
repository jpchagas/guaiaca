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

- Add limit of accounts creation

Add role system (owner / editor / viewer)
If you want, the next step is to update AccountMembersBar to include a Leave / Remove button for each member and use a reusable ConfirmActionDialog instead of window.confirm.

instead settings should be budget

Later, you should move this logic to a global AuthContext, and let AccountContext depend on it.

Add multi-account dashboard (aggregate view)

👉 Derived balance model (stored in account)

👉 Build Edit Transaction

- Zod Validation
- Build category system (chips + presets)
- Implement edit transaction (this will reuse the same dialog)
- Enable user to inform the parcel not only total parcels and if the parcel was the 1 split into months

## Current Context

🧾 Guaiaca Project — Full Context Snapshot (v10)

Last Updated: 2026-04-26
Type: React + Firebase (Firestore)
Domain: Personal & Shared Finance Management
Architecture Level: Early production-ready (solid foundation, evolving data model)

🧠 Core Concept

Guaiaca is a multi-account financial platform where:

A user can own multiple accounts
Accounts can be:
personal (single user)
shared (multiple users)
Financial data is:
real-time
account-scoped
dynamically aggregated
🏗️ Architecture Overview
Frontend
React (functional components)
Context API (global state)
MUI (Material UI)
Recharts (charts)
Backend
Firebase Auth
Firestore (real-time database)
🔑 Core Architectural Principles
1. Single Source of Truth
currentAccount drives all UI
No duplicated account state
2. Derived State (Not Stored)
Balances computed from transactions
No redundant financial fields
3. Real-Time First
Firestore onSnapshot drives UI
No manual refresh
4. Context-Driven State

Global state handled via:

AccountContext
DateContext
📦 Data Model (Updated)
🏦 Accounts
{
  id: string,
  ownerId: string,
  members: string[],
  type: "personal" | "shared",
  name?: string,
  createdAt?: timestamp
}
👤 Users
{
  id: string,
  email: string,
  name?: string,
  accounts: string[]
}
💰 Transactions (Expanded)
{
  id: string,
  accountId: string,

  amount: number,
  classification: "revenue" | "expense" | "investment",

  description: string,
  date: timestamp,

  category?: string,

  method?: "pix" | "credit_card" | "transfer" | "cash",

  responsibleUserId?: string,

  installment?: {
    current: number,
    total: number
  },

  createdAt: timestamp
}
🧠 Notes
classification is now user-defined (not inferred)
amount is always positive
financial direction comes from classification
installments stored as metadata (not split transactions)
🔄 AccountContext (Critical Layer)
Responsibilities
Load user accounts
Resolve currentAccount
Sync account selection
Provide members
Provide transactions
Compute balances
Key State
accounts: []
currentAccountId: string | null
currentAccount: object | null
members: []
transactions: []
balancesByAccountId: {}
loading: boolean
Key Behaviors
Deterministic Account Selection

Priority:

Current state
localStorage
First available account
Members Listener
Subscribes to account members
Fetches from /users
⚠️ Limited to 10 users (Firestore in constraint)
Transactions Listener
Real-time listener
Filtered by:
accountId
selected month/year
Balance Engine
balancesByAccountId = {
  [accountId]: {
    income,
    expenses,
    investments,
    balance
  }
}

Rules:

revenue → +balance
expense → -balance
investment → -balance
👥 Collaboration System
Capabilities
Owner can:
Share account
Remove members
Member can:
Access shared account
Leave account
Share Flow
Enter email
Query /users
Add to:
account.members
user.accounts
Restrictions
Only owner can share
Only shared accounts can be shared
Cannot add:
yourself
existing members
Members UI
Avatar chips
👑 Owner badge
"(You)" indicator
Inline actions:
remove (owner)
leave (member)
Permission Logic (Frontend)
const isOwner = account.ownerId === currentUserId;
const isShared = account.type === "shared";
const canShare = isOwner && isShared;
📊 Financial System
Transactions
Stored per account
Real-time updates
Single source of truth
Balance Calculation

Derived from transactions only

Filters
Month
Year
(from DateContext)
💳 Installments (New)
Current Approach
Stored as metadata:
installment: {
  current: number,
  total: number
}
Behavior
Only available for credit_card method
Created via UI toggle
Does not generate multiple transactions
Limitation
No future projection yet
No monthly distribution
Purely informational for now
📱 UI Structure
Layout
DashboardLayout
Navigation
Drawers (account/date)
FAB (add transaction)
Main Screens
Overview
Balance card
Summary cards
Pie chart
Members bar
Share dialog
Transactions
List of transactions
Delete functionality
(Edit pending)
Settings
Account info
Members (read-only)
🧩 Key Components (Updated)
AccountMembersBar
ShareAccountDialog
ConfirmActionDialog
CreateAccountDialog
✅ AddTransactionDialog (NEW)
🆕 AddTransactionDialog
Responsibilities
Isolated transaction form logic
Handles:
classification
category
method
responsible user
installments
Benefits
Decoupled from layout
Reusable (future: edit transaction)
Ready for validation layer
🔐 Firestore Rules (Current State)
Users
allow read: if request.auth != null;

⚠️ Allows email lookup (needed for sharing)
⚠️ Not fully secure

Accounts
Read: members only
Update:
owner → full control
member → remove self only
Transactions
Access controlled via account membership
⚠️ Known Limitations
🔴 High Priority
Firestore rules NOT enforcing:
account type
No atomic writes (share/remove)
No schema validation (Zod)
Members query limit (10 users)
🟡 Medium Priority
Roles (admin/editor/viewer)
Account rename/delete
Transaction editing
Installment system (full implementation)
🟢 Low Priority
UI polish
Animations
Dark mode improvements
🚀 Current Strengths

✅ Real-time architecture
✅ Clean data model
✅ Multi-account support
✅ Collaboration system
✅ Derived financial engine
✅ Stable AccountContext
✅ Permission-aware UI
✅ Modular form architecture (NEW)

🔥 Biggest Achievements
Solved async state desync (critical React issue)
Built cross-account financial engine
Implemented multi-user accounts
Unified data model (accountId)
Eliminated duplicated state bugs
Introduced structured transaction model
Decoupled form logic from layout
📍 Current Development Stage

👉 Early production-ready

Now transitioning from:

feature building → system hardening
🧭 Immediate Next Steps (Updated)
1. Security (most critical)
Enforce Firestore rules (ownership, type)
Add validation layer (Zod)
2. Data Integrity
Fix legacy transactions (wrong classification)
Normalize categories & methods
3. Collaboration
Roles & permissions
Member scaling (>10 users)
4. Financial Features
Transaction editing
Installment evolution:
projection OR
transaction splitting
5. UX
Account settings
Better category selection
Faster transaction input
