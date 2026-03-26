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

update all three auth screens (Login, Signup, ForgotPassword) to use the same Container + Paper + Stack + Alert layout, so they are fully uniform and ready for mobile responsiveness.

reviewing all navigation flows (Settings → Invite → JoinHousehold → Home) to make sure invites, household creation, and joining work seamlessly.

## Current Context

🧾 Guaiaca Project — Progress Summary (Updated)

Date: 2026-03-25
Phase: Mobile-first stabilization & household flow refinement

1. 🔐 Authentication & User Management

✅ Implemented

Firebase Auth: Signup / Login / Password Reset
onAuthStateChanged global listener
Route protection via React Router

🆕 Improvements

Login & Signup forms cleaned up (error handling, UX messaging)
Forgot password flow fully functional
HouseholdId automatically stored in localStorage after login
Removed redundant loaders, no flicker

⚠️ Notes

Auth system is now stable, mobile-friendly, and native-feel ready
2. 🏠 Household Management

✅ Implemented

Create household (Settings)
Invite members via link (/invite)
Join household via link (/joinHousehold)
Add members via email (Settings dialog)
Firestore structure: users → householdId, households → members array

🆕 Improvements

Invite link copy-to-clipboard works
Joined state handled to prevent duplicate joins
UI messages for success/error on join & add member
Members list fetch limited to Firestore 10-query batch

⚠️ Known Constraints

Firestore where("name", "in", [...]) limit (10 users)
Roles (admin/member) not yet implemented
Remove member flow not implemented
3. 📱 Mobile-First Dashboard & Navigation

🔥 Architectural Shift

App is fully mobile-first (maxWidth: 600px, centered content)
Removed sidebar/drawer logic & desktop branching
Top AppBar minimal, Bottom Navigation primary
FAB system simplified (<Fab> + <AddIcon>), replacing SpeedDial

🆕 Improvements

Cleaner, native app feel
Crash bug with SpeedDial resolved
4. 💰 Transactions & Overview

📊 Overview Page

Fully mobile-optimized
Cards stack vertically, better spacing

📋 Transactions Page

Horizontal scroll for mobile
Date filtering consistency improved

⚠️ Pending

Replace table with card list (fully mobile-native UX)
5. 🧠 State Management & Filters

⚠️ Still Pending (Critical)

Filters split across contexts/pages: FilterContext, Transactions local filtering
Next Step: unify into a single global filter system
6. 🚀 Splash Screen & App Load

✅ Implemented

Animated splash screen (2s fade/scale)
Silent auth check during splash
Removed full-screen loaders / Suspense fallback null

🆕 UX Improvements

Smooth transition from splash → auth → app
No flicker, native app feel
7. 🔥 Firebase Integration

✅ Stable

Auth, Firestore reads/writes, household ingestion
Transactions ingestion stable

🆕 Improvements

Cleaner error messaging in dialogs
Household join / invite flows fully integrated

⚠️ Needs Work

Validation before Firestore writes
Better Firestore error UX
Pagination / infinite scroll for members & transactions
8. 🎨 UI & Styling

🆕 Improvements

Mobile-first layout standardization
Paper containers, maxWidth limits, consistent spacing
FAB & Buttons consistent

⚠️ Pending

MUI Grid v2 migration
Dark mode polish
Design system consistency (spacing, colors, typography)
9. ⚠️ Stability & Error Handling

🆕 Improvements

Critical SpeedDial crash resolved
Household invite/join flows stable

🚨 Pending

Global Error Boundary
Unified error handling
10. ⚙️ Routing & Performance

🆕 Improvements

React Router v7 warnings fixed (startTransition, relativeSplatPath)
Lazy loading optimized
Removed unnecessary loaders
🧠 Final Assessment

The Guaiaca app is now:

✅ Strong in:

Authentication & household flows
Mobile-first UX & navigation
Invite/join system with Firestore integration

⚠️ Needs improvement:

State architecture (filters ⚠️ top priority)
Firestore validation & error handling
Roles & member management
Transactions UX (card-based, mobile-native)

🚀 Big Upgrade from Before:

Fully mobile-first, native app feel
Invite/join household flows stable
Splash + auth UX smooth
FAB system simplified & crash-free
🔥 Next Steps / Roadmap

Priority 1 — Architecture (CRITICAL)

Unify filters → single source of truth
Add Error Boundary & unified error handling
Firestore validation & query limits fix

Priority 2 — Core UX

Replace Transactions table → card list
Dialog validation & better messaging
Add confirmation flows (delete/edit members, transactions)

Priority 3 — Data & Performance

Pagination / infinite scroll
Optimize Firestore queries
Validate ingestion pipeline

Priority 4 — UI Polish

MUI Grid v2 migration
Spacing system consistency
Dark mode refinement

✅ Summary:
Guaiaca is stable, mobile-first, and ready for core feature expansion. Tomorrow’s focus should be state architecture and error handling, as well as polishing transactions UX.