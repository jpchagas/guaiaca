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
Build a category map layer (clean + fast)
Or auto-link category → classification (huge UX win)
Add edit/delete budget (inline, no dialogs)

## Current Context

🧾 Guaiaca Project — Full Context Snapshot (v13)

Last Updated: 2026-05-06
Type: React + Firebase (Firestore)
Domain: Personal & Shared Finance Management
Phase: System hardening + data normalization (active)

🧠 Core Concept

Guaiaca is a multi-account financial platform where:

A user can own multiple accounts
Accounts can be:
personal (single user)
shared (multi-user collaboration)

All financial data is:

Real-time (Firestore listeners)
Scoped by accountId
Derived (no stored balances)
Context-driven (AccountContext)
🏗️ Architecture Overview
Frontend
React (functional components)
Context API (AccountContext, DateContext)
MUI (Material UI)
Backend
Firebase Auth
Firestore (real-time DB)
🔑 Core Architectural Principles
1. Single Source of Truth
currentAccount drives all UI
No duplicated account state
2. Derived State Only
Balances computed from transactions
No stored aggregates
3. Real-Time First
onSnapshot for accounts & transactions
4. Context Driven

Global state:

AccountContext
DateContext
📦 Data Model (Updated v13)
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
💰 Transactions (v13 stable)
{
  id: string,
  accountId: string,

  amount: number,
  classification: "revenue" | "expense" | "investment",

  description: string,

  date: timestamp, // timezone-safe (midday normalized)

  category: string, // categoryId from Firestore

  method?: "pix" | "credit_card" | "transfer" | "cash",

  responsibleUserId?: string,

  installment?: {
    current: number,
    total: number
  },

  createdAt: timestamp
}
🏷️ Categories (NEW SYSTEM)
Collection: categories

Each document:

{
  name: string,
  key: string, // normalized slug
  createdAt: timestamp
}
Seeded categories include:
Salário
Receita de negócios
Investimentos
Reembolsos
Condomínio
Energia elétrica
Água
Gás
Internet
Manutenção
Telefone
Impostos
Supermercado
Restaurantes
Bares
Transporte
Compras
Cuidados Pessoais
Doações & Presentes
Saúde & Bem-estar
Assinaturas
Viagens
Entretenimento & Lazer
Tarifas bancárias
Empréstimos / financiamentos
Educação
Família & Filhos
Animais de Estimação
🧠 Categories System (NEW FEATURE)
Hook
useCategories()
Behavior:
Real-time Firestore listener
Ordered by name
Shared across:
AddTransactionDialog
AddBudgetDialog
Key Design Decision
Transactions store categoryId
UI resolves name via categories collection

👉 This is a normalization step (important for scale)

💳 Budget System (NEW FEATURE)
Budget model
{
  accountId: string,
  category: string, // categoryId
  limit: number,
  period: "monthly",
  createdAt: timestamp
}
Budget Dialog (v13)
Category selection from Firestore
Inline category creation supported
Prevents free-text drift
Ensures consistent reporting
🧾 AddTransactionDialog (v13)
Current capabilities:
Core
Create + Edit transactions
Full controlled form
Category system
Select from Firestore categories
Uses categoryId (not free text)
Installments (fully preserved)
installment: {
  current,
  total
}
UX improvements
Edit mode prefill
Validation
Safe date handling (midday normalization)
Submission locking
Installment logic
Only enabled for credit_card
1 ≤ current ≤ total
total ≥ 2
🧾 AddBudgetDialog (v13)
Features
Select category from Firestore
Inline category creation
Monthly budget limit
Account-scoped budgets
📱 UI Structure
Layout
DashboardLayout
Bottom navigation
Floating Action Button (Add Transaction)
Screens
Overview
Transactions
Budget (NEW)
Settings (simplified)
🔐 Firestore Rules (Current Status)
Problem area
Rules still partially permissive
Category collection currently open
Accounts
Member-based access
Transactions
Scoped by accountId membership
⚠️ Known Gaps (Updated)
🔴 Critical
Firestore rules not fully hardened
No batch writes for category creation flows
🟡 Medium
No schema validation layer (Zod missing)
No category enforcement rules
No budget aggregation engine yet
🟢 Low
UI polish
category autocomplete UX upgrade
analytics layer missing
🚀 Major Achievements (Updated)
Core system stability
Multi-account architecture stable
Real-time sync working correctly
Data correctness
Fixed timezone bug (critical fintech issue)
Normalized transaction model
UX improvements
Edit transaction flow fully working
Diff-aware editing UX
Category system introduced (major normalization step)
System evolution
Moved from free-text categories → structured taxonomy
Introduced Firestore-driven metadata layer
Began financial data normalization phase
🧭 Current Development Phase

👉 System hardening + financial data normalization

This phase focuses on:

data consistency
schema enforcement
scalable financial modeling
🧭 Immediate Next Steps (Refined)
1. 🔐 Security Hardening (HIGH PRIORITY)
Fix Firestore rules (categories + budgets)
Introduce role system (owner / member / viewer)
Lock category creation permissions
2. 🧱 Data Integrity Layer
Prevent duplicate categories
Normalize category keys
Introduce validation layer (Zod recommended)
3. 💳 Budget Engine Evolution

Next step after current work:

Monthly spending aggregation per category
Budget vs actual comparison
Progress indicators
4. 📊 Analytics Layer (Upcoming)
Category breakdown
Spending trends
Monthly insights
🧠 Strategic Insight (Updated)

You’ve now crossed a key architectural threshold:

👉 From flexible CRUD system → to structured financial model

This is important because:

categories are now normalized entities
budgets are linked to structured taxonomy
transactions are no longer free-text driven

👉 This is what enables real analytics later.