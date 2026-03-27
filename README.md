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

switch to onSnapshot, your app becomes real-time shared finance (huge UX win).

## Current Context

🧾 Guaiaca Project — Progress Summary (Updated)

Date: 2026-03-27
Phase: Multi-account architecture + mobile-first refinement

1. 🔐 Authentication & User Management
✅ Implemented
Firebase Auth: Signup / Login / Password Reset
onAuthStateChanged global listener
Route protection via React Router
🆕 Improvements
Cleaned auth UX (errors, messaging, no flicker)
Stable session persistence
User document (users/{userId}) now includes:
name
email
accounts: [] ✅ NEW (replaces householdId)
⚠️ Notes
❌ Household model removed
✅ Fully migrated to multi-account system
2. 🏦 Account System (NEW CORE ARCHITECTURE)
✅ Implemented
Firestore structure:
users → accounts: [accountId]
accounts → members: [userId]
Create account (Overview)
Switch accounts (global)
Persist selected account via localStorage
Multi-account support (personal, family, etc.)
🆕 Improvements
🔥 Global account state via DashboardLayout

All pages consume account via:

useOutletContext()
Real-time UI sync when switching accounts
Account automatically restored on app load
⚠️ Known Constraints
Account names not yet displayed (IDs only)
No roles (owner/admin/member)
No account deletion / editing yet
3. 👨‍👩‍👧‍👦 Members Management (Refactored)
✅ Implemented
Add members via email (Settings)
Members stored in accounts.members
User document updated with account reference
Members list fetched via Firestore query
🆕 Improvements
Settings now:
Fetches account dynamically from accountId
Fetches members separately
Fully reactive to account switching
⚠️ Known Constraints
Firestore in query limit (10 users)
No remove member flow
No invite system (link-based removed)
No role system
4. 📱 Mobile-First Dashboard & Navigation
✅ Implemented
Fully mobile-first layout
Bottom Navigation (primary navigation)
Minimal AppBar
FAB for transaction creation
🆕 Improvements
🔥 Account switcher moved to global (DashboardLayout)
Cleaner architecture (no page-level account logic)
Native app feel achieved
5. 💰 Transactions & Overview
📊 Overview Page
✅ Implemented
Account creation
Account switching (UI always visible)
Balance, income, expenses, investments
Pie chart (Recharts)
🆕 Improvements
Always-visible:
Account selector
Create account button
Fully synced with global account state
📋 Transactions Page
✅ Implemented
Fetch transactions by accountId
Delete transactions
Filter by date
🆕 Improvements
🔥 Uses global account (useOutletContext)
Instant refresh when switching accounts
Improved empty states
⚠️ Pending
Edit transaction
Card-based UI improvements
Pagination / infinite scroll
6. 🧠 State Management & Architecture
🔥 Major Upgrade
✅ Implemented
Single source of truth for account
→ DashboardLayout
Removed duplicated state across pages
Removed localStorage dependency inside pages
🆕 Improvements
Clean separation:
Layout = state owner
Pages = consumers
Scalable architecture for multi-account
⚠️ Pending (Critical Next Step)
Replace useOutletContext with:
👉 React Context (AccountContext)
Unify filters into global system
7. 🚀 Splash Screen & App Load
✅ Implemented
Animated splash screen
Silent auth check
Smooth transitions
🆕 UX Improvements
No flicker
Native app feel maintained
8. 🔥 Firebase Integration
✅ Stable
Auth
Firestore reads/writes
Transactions linked to accountId
Members linked to accounts
🆕 Improvements
Cleaner data model:
❌ households
✅ accounts
Consistent data relationships
⚠️ Needs Work
Firestore validation rules (important)
Better error handling
Query limits handling
Batch operations for scaling
9. 🎨 UI & Styling
🆕 Improvements
Consistent mobile-first layout
Clean Material UI usage
Better spacing and hierarchy
⚠️ Pending
Show account names instead of IDs
Design system consistency
Dark mode polish
10. ⚠️ Stability & Error Handling
🆕 Improvements
Major architectural bugs eliminated
State inconsistencies fixed (huge win)
🚨 Pending
Global Error Boundary
Centralized error handling
Better user-facing error messages
11. ⚙️ Routing & Performance
🆕 Improvements
React Router optimized
Layout-based architecture
No redundant fetches
🧠 Final Assessment
✅ Strong Areas
🔥 Multi-account architecture (major upgrade)
Mobile-first UX (clean and consistent)
Clear separation of concerns (layout vs pages)
Firebase data model now scalable
⚠️ Needs Improvement
🔴 High Priority
Global state (AccountContext + Filters)
Firestore validation & security rules
Error handling system
🟡 Medium Priority
Account UX (names, roles)
Transactions UX (edit, pagination)
Member management (remove, roles)
🚀 Big Upgrade From Previous Version
❌ Removed household complexity
✅ Introduced scalable account system
🔥 Centralized state in layout
🔥 Eliminated duplicated logic across pages
✅ Cleaner, production-ready architecture direction
🔥 Next Steps / Roadmap
Priority 1 — Architecture (CRITICAL)
Create AccountContext (replace Outlet context)
Unify filters (global system)
Add Firestore validation rules
Priority 2 — Core UX
Account names (instead of IDs)
Edit/delete transactions
Member removal + roles
Priority 3 — Data & Performance
Pagination / infinite scroll
Optimize Firestore queries
Batch writes for ingestion
Priority 4 — UI Polish
Design system consistency
Dark mode refinement
Micro-interactions
✅ Final Summary

Guaiaca is now:

✅ Multi-account ready
✅ Mobile-first and stable
✅ Architecturally clean and scalable

⚠️ Next focus:

State architecture (Context)
Firestore robustness
UX polish