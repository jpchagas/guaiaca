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

## Current Context

Guaiaca Project — Progress Summary

Date: 2026-03-04
Project: Personal Finance & Household Expense Management App

1. Authentication & User Management

Signup / Login / Forgot Password

Users can sign up with name, email, and password (Signup.jsx).

Login authenticates with Firebase Auth (Login.jsx) and retrieves householdId from Firestore.

Password reset functionality implemented via Firebase Auth (ForgotPassword.jsx).

User Firestore Document

Stores name, email, householdId, createdAt.

householdId starts as null until the user joins or creates a household.

2. Household Management

Settings & Household Operations (Settings.jsx)

Users can create a household if they don’t have one.

Add members via email, or generate invite links.

Household document includes name, members, createdAt.

Joining a Household

JoinHousehold.jsx and Invite.jsx allow users to join via invite link (householdId query param).

Updates both user document (householdId) and household document (members array).

3. Dashboard & Navigation

Dashboard Layout (DashboardLayout.jsx)

Persistent sidebar with Overview, Transactions, and Settings pages.

Mobile responsive design with BottomNavigation for small screens.

Includes SpeedDial for quick transaction entry:

Upload CSV/Excel files.

Add manually via a form.

Handles logout globally.

Month filter (selectedMonth) implemented; can integrate with FilterContext for global filtering.

4. Transactions & Overview

Overview Page (Overview.jsx)

Fetches transactions for the current household.

Supports global filters via FilterContext (classification, category, method, dateFrom, dateTo).

Computes:

Total Income

Total Expenses

Investments

Total Balance

Displays pie chart for expenses by category.

Option to seed mock transactions if none exist.

Transactions Management

Manual addition of transactions (with parceling support) via DashboardLayout.

File ingestion system implemented:

parseFile handles CSV/Excel parsing.

ingestTransactionsList writes transactions to Firestore.

5. State & Context

Global Filters (FilterContext.jsx)

Provides a central place to store filters (classification, method, category, dateFrom, dateTo).

Overview.jsx uses it to filter transactions.

Suggestion: integrate month filter (selectedMonth) into this context to unify filtering across pages.

6. Navigation & Routing

React Router used for:

/ → Login

/signup → Sign Up

/forgot-password → Password reset

/home → Overview

/home/transactions → Transactions

/home/settings → Settings

/invite → Join via invite link

DashboardLayout wraps /home routes for consistent layout.

7. Styling & UI

Uses MUI components across the app:

Container, Paper, Typography, Button, TextField, Drawer, SpeedDial, etc.

Responsive layout:

Permanent sidebar on desktop.

Bottom navigation on mobile.

Visual feedback for:

Loading (CircularProgress)

Success & error messages (Alert, color-coded Typography).

8. Firebase Integration

Auth: createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail.

Firestore:

Users collection (users) → name, email, householdId.

Households collection (households) → name, members.

Transactions collection (transactions) → description, amount, classification, category, parcel info, date, method, card, householdId, createdAt.

Firestore Operations:

setDoc, updateDoc, getDoc, getDocs, arrayUnion, serverTimestamp.

9. Next Steps / To Do

 Integrate DashboardLayout month filter fully with FilterContext for global filtering.

 Build Transactions page to list, edit, and delete transactions.

 Enhance file ingestion and parser error handling.

 Add pagination / lazy loading for transactions list.

 Improve member management in households (remove members, roles?).

 UI/UX polish (dark mode, alerts, confirmation dialogs).

Summary:

You’ve built the foundation of a household expense tracking app with:

Authentication & user management

Household creation/joining via invites

Transaction recording (manual + file upload)

Global filtering system

Responsive dashboard layout

The app is mostly functional; the next work involves connecting all the pieces (Filters, Transactions page, and file ingestion improvements) and refining the user experience.