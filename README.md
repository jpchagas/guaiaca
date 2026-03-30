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


Turn “Create Account” into a proper modal flow
Or upgrade AccountContext to real-time (onSnapshot)

Create Account Modal (with name input + validation)

switch to onSnapshot, your app becomes real-time shared finance (huge UX win).

on account selection show name not id

create an month filter on top too

the share account should be something like xepa app

instead settings should be budget

## Current Context

🧾 Guaiaca Project — Progress Summary (Updated)

Date: 2026-03-29
Phase: Multi-account architecture + global state (Context) + layout consolidation

1. 🔐 Authentication & User Management
✅ Implemented
Firebase Auth: Signup / Login / Password Reset
onAuthStateChanged global listener
Route protection via React Router
🆕 Improvements
Clean auth UX (errors, messaging, no flicker)
Stable session persistence
User document (users/{userId}) now includes:
name
email
accounts: [] ✅
⚠️ Notes
❌ Household model removed
✅ Fully migrated to multi-account system
2. 🏦 Account System (CORE ARCHITECTURE)
✅ Implemented
Firestore structure:
users → accounts: [accountId]
accounts → members: [userId]
Create account (now global via layout)
Switch accounts (global)
Persist selected account via localStorage
Multi-account support (personal, family, etc.)
🆕 Major Upgrade
🔥 AccountContext introduced (NEW SINGLE SOURCE OF TRUTH)
Global state no longer tied to layout or pages
Account switching now available anywhere in app
Automatic account restore on app load
🆕 UI Improvements
🔥 Account switcher moved to AppBar (global)
No more page-level account UI
Cleaner, app-wide behavior
⚠️ Known Constraints
⚠️ Account names partially implemented (needs full fetch layer)
❌ No roles (owner/admin/member)
❌ No account deletion/edit yet
3. 👨‍👩‍👧‍👦 Members Management
✅ Implemented
Add members via email (Settings)
Members stored in accounts.members
User document updated with account reference
Members list fetched via Firestore query
🆕 Improvements
Fully reactive to AccountContext switching
Clean separation of account vs UI logic
⚠️ Known Constraints
Firestore in query limit (10 users)
No remove member flow
No role system
4. 📱 Mobile-First Dashboard & Navigation
✅ Implemented
Fully mobile-first layout
Bottom Navigation (primary navigation)
Minimal AppBar
FAB for transaction creation
🆕 Major Improvements
🔥 Account switcher in global AppBar
🔥 Layout simplified (no business logic)
🔥 Native app feel significantly improved
5. 💰 Transactions & Overview
📊 Overview Page
✅ Implemented
Balance, income, expenses, investments
Pie chart (Recharts)
Fully reactive to account + filters
🆕 Improvements
❌ Removed account logic (now global)
Cleaner, pure presentation component
📋 Transactions Page
✅ Implemented
Fetch transactions by accountId
Delete transactions
Filter by date
🆕 Improvements
🔥 Now uses AccountContext (no OutletContext)
Instant refresh when switching accounts
Improved empty states
⚠️ Pending
Edit transaction
Pagination / infinite scroll
UI polish (cards, grouping)
6. 🧠 State Management & Architecture
🔥 MAJOR BREAKTHROUGH
✅ Implemented
🔥 AccountContext (global state layer)
Removed useOutletContext completely
Removed duplicated state across pages
Pages are now pure consumers
🆕 Architecture
Context = global state
Layout = UI shell
Pages = feature modules
🆕 Improvements
True separation of concerns
Scalable architecture for multi-account system
Easier future features (roles, permissions, sharing)
⚠️ Pending
Global Filters system refinement
Potential normalization of account data (id + name map)
7. 🚀 Splash Screen & App Load
✅ Implemented
Animated splash screen
Silent auth check
Smooth transitions
🆕 UX Improvements
No flicker
Account restored seamlessly via Context
Native app feel maintained
8. 🔥 Firebase Integration
✅ Stable
Auth
Firestore reads/writes
Transactions linked to accountId
Members linked to accounts
🆕 Improvements
Cleaner data model:
❌ households → ✅ accounts
Consistent relationships across collections
⚠️ Needs Work
Firestore validation rules (critical)
Query limits handling
Batch operations for scale
Error standardization
9. 🎨 UI & Styling
🆕 Improvements
Consistent mobile-first layout
Clean Material UI usage
Better spacing and hierarchy
Global account UX (huge improvement)
⚠️ Pending
Account names fully surfaced everywhere
Design system consistency
Dark mode polish
10. ⚠️ Stability & Error Handling
🆕 Improvements
Major architectural bugs eliminated
Removed context mismatch issues (big win)
Stable global state
🚨 Pending
Global Error Boundary
Centralized error handling
Better user-facing error messages
11. ⚙️ Routing & Performance
🆕 Improvements
React Router simplified
Layout now purely structural
No redundant fetches
Context-driven rendering
🧠 Final Assessment
✅ Strong Areas
🔥 AccountContext (production-grade architecture)
🔥 Multi-account system (clean + scalable)
🔥 Mobile-first UX (native feel)
🔥 Clean separation: Context / Layout / Pages
🔥 Firebase model aligned with scaling
⚠️ Needs Improvement
🔴 High Priority
Firestore security rules
Error handling system
Account data enrichment (names, metadata)
🟡 Medium Priority
Account UX (rename, roles)
Transactions UX (edit, pagination)
Member management (remove, roles)
🔥 Big Upgrade From Previous Version
❌ Removed household complexity
❌ Removed useOutletContext
✅ Introduced AccountContext (global state)
✅ Centralized account logic properly
✅ Eliminated duplicated logic across pages
✅ Layout simplified into pure UI shell
🔥 Architecture now production-ready
🚀 Next Steps / Roadmap
Priority 1 — Data & Security (CRITICAL)
Firestore validation rules
Secure multi-account access
Error handling system
Priority 2 — Core UX
Account names (full implementation)
Create Account modal (name input)
Edit transactions
Member roles + removal
Priority 3 — Performance & Scale
Pagination / infinite scroll
Query optimization
Batch writes
Priority 4 — UI Polish
Design system consistency
Dark mode refinement
Micro-interactions
✅ Final Summary

Guaiaca is now:

✅ Multi-account ready
✅ Mobile-first and smooth
✅ Context-driven (modern React architecture)
✅ Clean, scalable, and production-aligned

⚠️ Next Focus
Firestore robustness (rules + validation)
Account UX (names, roles)
Transactions UX
Error handling system