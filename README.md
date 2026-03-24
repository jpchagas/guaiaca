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

## Current Context

🧾 Guaiaca Project — Progress Summary (Updated)

Date: 2026-03-24
Project: Personal Finance & Household Expense Management App

1. 🔐 Authentication & User Management
✅ Implemented
Signup, Login, and Password Reset using Firebase Auth
User authentication state handled globally (onAuthStateChanged)
👤 User Document (Firestore)

Stores:

name
email
householdId
createdAt
householdId is initially null until the user joins or creates a household
⚠️ Notes
Authentication flow is stable
App correctly blocks access to protected routes
2. 🏠 Household Management
✅ Implemented
Users can create a household
Users can join via invite link (/invite?householdId=...)
Members can be added via email
Invite link generation supported
📦 Household Document
name
members (array of user IDs)
createdAt
⚠️ Known Constraints
Firestore rules enforce strict access based on householdId
Member fetching uses where("__name__", "in", [...]) (limited to 10 users per query)
Permission errors may occur if rules and queries are not aligned
🔧 Needs Improvement
Better member management (remove users, roles, permissions)
Improve error handling for permission failures
3. 🧭 Dashboard & Navigation
✅ Implemented
Persistent sidebar (desktop)
Bottom navigation (mobile)
Page routing via React Router:
/home → Overview
/home/transactions
/home/settings
Global logout handling
➕ SpeedDial (FAB)
Upload transaction file
Add transaction manually
⚠️ Fixes Applied
SpeedDial interaction fixed (z-index + layout issues)
Dialogs now properly triggered
4. 💰 Transactions & Overview
📊 Overview Page
✅ Features
Fetches transactions by householdId
Displays:
Total Income
Total Expenses
Investments
Balance
Pie chart: expenses by category
Mock data seeding option
⚠️ Fixes Applied
Fixed crash caused by missing context provider
Defensive filtering (filters?.)
📋 Transactions Page
✅ Features
List transactions with:
Pagination
Inline editing
Delete functionality
Editable fields:
description, amount, category, classification, method, etc.
⚠️ Notes
Depends on month filtering (currently separate context)
Works but not yet unified with global filters
📥 Transaction Ingestion
✅ Implemented
File upload (CSV / Excel)
parseFile → parses input
ingestTransactionsList → writes to Firestore
🔧 Needs Improvement
Error handling for invalid formats
Validation before ingestion
5. 🧠 State Management & Context
✅ Implemented
FilterContext for:
classification
category
method
date range
⚠️ Current Issue (Important)
Filtering logic is split across multiple sources:
FilterContext
selectedMonth (DashboardLayout)
MonthFilterContext (Transactions)

👉 This creates inconsistency across pages

🔧 Next Step
Unify all filters into a single global filtering system
6. 🔥 Firebase Integration
✅ Auth
createUserWithEmailAndPassword
signInWithEmailAndPassword
sendPasswordResetEmail
✅ Firestore Collections
users
name, email, householdId
households
name, members
transactions
description, amount, classification, category
date, method, card
parcel info
householdId
createdAt
🔐 Security Rules
✅ Implemented
Access restricted by householdId

Helper function:

userHouseholdId()
⚠️ Known Issues
“Missing or insufficient permissions” errors in some queries
UI does not always handle permission failures gracefully
7. 🎨 UI & Styling
✅ Implemented
MUI components across the app
Responsive design:
Sidebar (desktop)
Bottom navigation (mobile)
Feedback components:
Loading (CircularProgress)
Alerts & Snackbar
⚠️ Fixes Applied
MUI Grid v2 warnings identified (migration needed)
SpeedDial rendering issues fixed
🔧 Needs Improvement
Complete migration to MUI Grid v2
UI consistency and spacing
Dark mode polish
8. ⚠️ Stability & Error Handling
🚨 Current Gaps
No Error Boundary implemented
App can crash if context is missing
Limited user-facing error feedback
🔧 Required Improvements
Add global Error Boundary
Standardize error handling across async operations
Improve feedback for Firestore errors
9. 🚀 Next Steps / Roadmap
🔥 Priority 1 — Stability & Architecture
Wrap app properly with providers (FilterContext)
Unify ALL filters into a single context
Fix Firestore query + rules alignment
Add global Error Boundary
⚙️ Priority 2 — Core Feature Completion
Finalize Transactions page UX
Add confirmation dialogs (delete/edit)
Improve empty and loading states
📊 Priority 3 — Data & Performance
Pagination / lazy loading
Optimize Firestore queries
Improve ingestion validation
🎨 Priority 4 — UI/UX Polish
Complete MUI Grid v2 migration
Improve layout consistency
Centralize Snackbar/alerts system
Enhance mobile experience
🧠 Final Assessment

The Guaiaca app is currently:

✅ Feature-complete at a functional level
⚠️ Inconsistent at an architectural level
🔧 Entering stabilization and refinement phase

You’ve successfully built:

Authentication system
Household-based data model
Transaction tracking (manual + file ingestion)
Responsive dashboard UI