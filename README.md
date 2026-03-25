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
Phase: Stabilization → Mobile-first refinement

1. 🔐 Authentication & User Management
✅ Implemented
Firebase Auth:
Signup / Login / Password Reset
onAuthStateChanged global listener
Route protection via React Router
🆕 Improvements
Integrated with Splash Screen flow
Removed redundant loading states (no more double loaders)
⚠️ Notes
Auth is now:
✅ Stable
✅ Cleaner UX (no flicker)
2. 🏠 Household Management
✅ Implemented
Create household
Join via invite link (/invite)
Add members via email
Firestore structure working
⚠️ Known Constraints
Firestore where("__name__", "in", [...]) limit (10 users)
Strict rules tied to householdId
🔧 Needs Improvement
Roles (admin/member)
Remove member flow
Better permission error handling
3. 📱 Mobile-First Dashboard & Navigation (MAJOR UPDATE)
🔥 Architectural Shift

👉 App is now mobile-first (no desktop-specific UI)

❌ Removed
Sidebar / Drawer logic
useMediaQuery branching
Desktop layout complexity
✅ Implemented
Top AppBar (minimal)
Bottom Navigation (primary navigation)
Centered content (maxWidth: 600)
Native-app-like layout
4. ➕ FAB System (IMPORTANT CHANGE)
❌ Removed
SpeedDial (causing crashes + overkill UX)
✅ Replaced with
Simple FAB (Floating Action Button)
<Fab>
  <AddIcon />
</Fab>
🧠 UX Improvement
Cleaner
More mobile-native
No MUI internal errors (SpeedDial.replace bug resolved)
5. 💰 Transactions & Overview
📊 Overview Page
🆕 Improvements
Fully mobile optimized
Cards now stack vertically (no 4-column desktop layout)
Better spacing & readability
📋 Transactions Page
🆕 Improvements
Horizontal scroll (overflowX: auto)
Mobile-friendly table interaction
Better date filtering (fixed inconsistencies)
⚠️ Still Pending
Replace table with card list (mobile-native UX) ← big future win
6. 🧠 State Management & Filters
⚠️ Current Situation (UNCHANGED — STILL IMPORTANT)

Filters are still split:

FilterContext
selectedMonth (DashboardLayout)
Transactions local filtering
🔥 Next Critical Step

👉 Unify into ONE global filter system

This is now your #1 architecture priority

7. 🚀 Splash Screen System (NEW)
✅ Implemented
Animated splash screen
Appears on every app open
Smooth fade + scale animation
🧠 UX Flow (NOW CLEAN)
Splash Screen (2s)
   ↓
Auth resolved silently
   ↓
App loads instantly
❌ Removed
Full-screen auth spinner
Heavy Suspense loaders
✅ Suspense Optimization
<Suspense fallback={null}>

✔ No flicker
✔ Native feel

8. 🔥 Firebase Integration
✅ Stable
Auth
Firestore reads/writes
Transactions ingestion
🆕 Improvements
Cleaner ingestion UX
Better error capture in dialogs
⚠️ Still Needs Work
Validation before writes
Better Firestore error UX
9. 🎨 UI & Styling
🆕 Major Improvements
Mobile-first layout standardization
Removed desktop branching logic
Cleaner spacing + structure
Consistent container width
⚠️ Pending
MUI Grid v2 full migration
Design system consistency
Visual polish (colors, spacing rhythm)
10. ⚠️ Stability & Error Handling
🆕 Improvements
Fixed critical crash:
❌ SpeedDial error (reading 'replace')
✅ Fully resolved
🚨 Still Missing
Global Error Boundary
Unified error handling system
11. ⚙️ Routing & Performance
🆕 Improvements
React Router warnings fixed:
future={{
  v7_startTransition: true,
  v7_relativeSplatPath: true
}}
Lazy loading optimized
Removed unnecessary loaders
🚀 Updated Roadmap
🔥 Priority 1 — Architecture (CRITICAL)
 Unify filters (single source of truth)
 Add Error Boundary
 Fix Firestore rules/query mismatches
⚙️ Priority 2 — Core UX
 Replace Transactions table → mobile card list
 Improve dialogs (validation + UX)
 Add confirmation flows (delete/edit)
📊 Priority 3 — Data & Performance
 Pagination / infinite scroll
 Optimize Firestore queries
 Validate ingestion pipeline
🎨 Priority 4 — UI Polish
 MUI Grid v2 migration
 Spacing system consistency
 Dark mode refinement
🧠 Final Assessment (UPDATED)

The Guaiaca app is now:

✅ Strong in:
Core features
Mobile UX direction
Data model
Navigation structure
⚠️ Needs improvement in:
State architecture (filters ⚠️ biggest issue)
Error handling
Data consistency
🚀 Big upgrade from before:

👉 You moved from:

“Responsive web app”

👉 To:

Mobile-first app with native feel