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

- Zod Validation
- Build category system (chips + presets)

## Current Context

🧾 Guaiaca Project — Full Context Snapshot (v12)

Last Updated: 2026-05-01
Type: React + Firebase (Firestore)
Domain: Personal & Shared Finance Management
Architecture Level: Early production-ready → system hardening (active phase)

🧠 Core Concept

Guaiaca is a multi-account financial platform where:

A user can own multiple accounts
Accounts can be:
personal (single user)
shared (multi-user collaboration)

Financial data is:

Real-time (Firestore listeners)
Account-scoped
Dynamically aggregated (derived state)
🏗️ Architecture Overview
Frontend
React (functional components)
Context API (global state)
MUI (Material UI)
Recharts
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

Global state via:

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
💰 Transactions (v12 — Timezone-Safe)
{
  id: string,
  accountId: string,

  amount: number,
  classification: "revenue" | "expense" | "investment",

  description: string,

  // ✅ FIXED: timezone-safe timestamp
  date: timestamp,

  // 🔮 (planned) future-safe date key
  // dateKey: "YYYY-MM-DD",

  category?: string,

  method?: "pix" | "credit_card" | "transfer" | "cash",

  responsibleUserId?: string,

  installment?: {
    current: number,
    total: number
  },

  createdAt: timestamp
}
🧠 Notes (Updated)
amount is always positive
Financial direction derived from classification
Installments remain metadata-only
System supports historical installment input
🆕 Date Handling (Critical Fix)
Dates are now created using:
new Date(year, month - 1, day, 12)

✅ Prevents:

UTC shift bugs
“transaction appears on previous day”
timezone inconsistencies

⚠️ toISOString() is no longer used for form hydration

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

⚠️ Firestore in query limit → max 10 users

Transactions Listener
Real-time (onSnapshot)
Filtered by:
accountId

👉 Date filtering moved to client layer (DateContext)

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

revenue → +
expense → -
investment → -
👥 Collaboration System
Capabilities

Owner

Share account
Remove members

Member

Access shared account
Leave account
Share Flow
Input email
Query /users
Update:
account.members
user.accounts
Restrictions
Only owner can share
Only shared accounts allowed
Cannot add:
yourself
existing members
Permission Logic
const isOwner = account.ownerId === currentUserId;
const isShared = account.type === "shared";
const canShare = isOwner && isShared;
📊 Financial System
Transactions
Stored per account
Real-time updates
Single source of truth
Balance Calculation
Fully derived from transactions
Filters

From DateContext:

Month
Year

⚠️ Filtering depends on correct timezone-safe dates (now fixed)

💳 Installments System (v12)
Current Model
installment: {
  current: number,
  total: number
}
Capabilities
Supports historical input (e.g. 5/12)
Optional toggle
Credit card only
Constraints
total >= 2
1 <= current <= total
Limitations
No projection
No monthly distribution
No linkage across transactions
🧩 AddTransactionDialog (v12 — Hardened)
Responsibilities
Create + Edit transactions
Fully controlled form
Key Improvements
✅ Timezone Fix (Critical)
Local date creation (midday normalization)
No UTC conversion bugs
✅ Edit Mode (Fully Functional)
Form pre-filled correctly
No blank dialog issue
✅ Diff-Aware UX (Pro-Level)
Shows changed fields before saving
✅ Inline Validation
Real-time feedback
Prevents invalid writes
✅ Submission Safety
Disabled button while saving
Prevents duplicate writes
✅ Stable State Model
Form uses strings
Model uses numbers
📄 Transactions Page (v12 — UX Upgraded)
Improvements
✅ Click-to-edit interaction
Entire card is interactive
✅ Clear financial signal
Signed amounts (+ / -)
Color-coded
✅ Installment visibility
Inline display (e.g. 3/12)
✅ Better formatting
Localized dates
Clean hierarchy
✅ Edit + Delete actions
Inline icons
Non-blocking UX
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
List (improved UX)
Delete
Edit (implemented)
Settings
Account info
Members (read-only)
🔐 Firestore Rules (Current State)
Users
allow read: if request.auth != null;

⚠️ Email lookup still open (not secure)

Accounts
Read: members only
Update:
owner → full control
member → remove self
Transactions
Access via account membership
⚠️ Known Limitations (Updated)
🔴 High Priority
Firestore rules incomplete
No atomic writes (sharing)
No schema validation (Zod)
Member limit (10 users)
🟡 Medium Priority
Roles (admin/editor/viewer)
Account rename/delete
Installment evolution
Category normalization
🟢 Low Priority
UI polish
Animations
Dark mode
🚀 Current Strengths
✅ Real-time architecture
✅ Clean data model
✅ Multi-account system
✅ Collaboration support
✅ Derived balance engine
✅ Stable AccountContext
✅ Permission-aware UI
✅ Modular form system
✅ Installment flexibility
✅ Timezone-safe transactions (NEW)
✅ Edit flow (NEW)
✅ Improved UX (NEW)
🔥 Biggest Achievements
Solved async state desync (critical React issue)
Built cross-account financial engine
Implemented collaboration model
Unified transaction model (accountId)
Eliminated duplicated state bugs
Structured transaction schema
Decoupled form logic
Enabled installment tracking
Fixed controlled input UX issues
Eliminated timezone bug (critical fintech issue)
Introduced diff-aware editing UX
📍 Current Development Stage

👉 System hardening (active)
Core product is now stable enough for real usage

🧭 Immediate Next Steps (Refined)
1. 🔐 Security (Critical)
Enforce Firestore rules
Add schema validation (Zod)
2. 🧱 Data Integrity
Normalize categories & methods
Introduce versioning/migrations
(Optional) introduce dateKey
3. 👥 Collaboration
Atomic writes (batch)
Roles & permissions
Scale members (>10 users)
4. 💳 Financial Evolution
Installment projection engine (next big feature)
Transaction editing enhancements
5. ✨ UX
Faster transaction input
Structured categories
Micro-interactions
🧠 Strategic Insight (New)

You just crossed a critical boundary:

From “working app” → to financially reliable system

Fixing the timezone bug + editing UX means:

👉 Users can now trust the data

That’s the real milestone.

If you want next, we can move into:

💳 Installment projection engine (high impact)
📊 Monthly cash flow forecasting
🧠 Smart categorization / insights layer

That’s where this becomes a real fintech product.