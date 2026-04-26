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

🧾 Guaiaca Project — Full Context Snapshot (v9)

Last Updated: 2026-04-26
Type: React + Firebase (Firestore)
Domain: Personal & Shared Finance Management
Architecture Level: Early production-ready (solid foundation, some security gaps)

🧠 Core Concept

Guaiaca is a multi-account financial platform where:

A user can own multiple accounts
Accounts can be:
personal (single user)
shared (multiple users)
Financial data is:
real-time
account-scoped
aggregated dynamically
🏗️ Architecture Overview
Frontend
React (functional components)
Context API for global state
MUI (Material UI)
Recharts (charts)
Backend
Firebase Auth
Firestore (real-time DB)
🔑 Core Architectural Principles
1. Single Source of Truth
currentAccount is the only account reference used in UI
No duplicated state (account was removed)
2. Derived State (Not Stored)
Balances are computed from transactions
No redundant financial fields stored
3. Real-Time First
Firestore onSnapshot drives UI updates
No manual refresh needed
4. Context-Driven State

Global state handled via:

AccountContext
DateContext
📦 Data Model
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
💰 Transactions
{
  id: string,
  accountId: string,
  amount: number,
  classification: "revenue" | "expense" | "investment",
  category?: string,
  date: timestamp
}
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
Subscribes to selected account members
Fetches user documents (users collection)
Limited to 10 users (Firestore in constraint)
Transactions Listener
Single listener across all accounts
Filters by:
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
Query /users by email
Add user to:
account.members
(optionally) user.accounts
Restrictions
Only owner can share
Only shared accounts can be shared
Cannot add:
yourself
existing members
Members UI
Avatar chips
👑 owner badge
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
Used as single source of truth
Balance Calculation

Derived from transactions:

revenue → +balance
expense → -balance
investment → -balance
Filters
Month
Year

(from DateContext)

📱 UI Structure
Layout
DashboardLayout
Controls drawers (account/date switchers)
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
🧩 Key Components
AccountMembersBar
ShareAccountDialog
ConfirmActionDialog
CreateAccountDialog
🔐 Firestore Rules (Current State)
Users
allow read: if request.auth != null;

⚠️ Allows email lookup (needed for sharing)
⚠️ Not fully secure (acceptable for now)

Accounts
Read: only members
Update:
owner → full control
member → can remove self only
Transactions
Access controlled via account membership
⚠️ Known Limitations
🔴 High Priority
Firestore rules NOT enforcing:
account type (personal vs shared)
No atomic writes (share/remove)
No schema validation (Zod/Yup)
Members query limit (10 users)
🟡 Medium Priority
Roles (admin/editor/viewer)
Account rename/delete
Transaction editing
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
🔥 Biggest Achievements
Solved async state desync (critical React issue)
Built cross-account financial engine
Implemented multi-user accounts
Unified data model (accountId)
Eliminated duplicated state bugs
📍 Current Development Stage

👉 Early production-ready

Strong foundation, but needs:

backend enforcement (rules)
validation layer
performance improvements
🧭 Immediate Next Steps (Recommended)
1. Security (most important)
Enforce account type in Firestore rules
Add validation layer (Zod)
2. Collaboration
Roles & permissions
Member limit workaround (>10)
3. UX
Edit transactions
Account settings
