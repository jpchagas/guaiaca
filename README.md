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
connecting Goals ↔ Transactions (this is where it becomes powerful)

## Current Context

🧾 Guaiaca Project — Full Context Snapshot (v14)

Last Updated: 2026-05-06
Type: React + Firebase (Firestore)
Domain: Personal & Shared Finance Management
Phase: System hardening + financial data normalization (active)

🧠 Core Concept

Guaiaca is a multi-account financial platform where:

A user can own multiple accounts
Accounts can be:
personal (single-user)
shared (multi-user collaboration)

All financial data is:

🔄 Real-time (Firestore listeners)
📦 Scoped by accountId
🧠 Fully derived (no stored balances)
🧩 Context-driven (AccountContext + DateContext)
🏗️ Architecture Overview
Frontend
React (functional components)
Context API:
AccountContext
DateContext
MUI (Material UI)
Backend
Firebase Auth
Firestore (real-time database)
🔑 Core Architectural Principles
1. Single Source of Truth
currentAccount drives all UI state
No duplicated account state
2. Derived State Only
Balances computed from transactions
No stored aggregates
3. Real-Time First
onSnapshot drives:
transactions
accounts
budgets
categories
4. Context-Driven Architecture

Global state:

AccountContext
DateContext
📦 Data Model (v14 Stable)
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
💰 Transactions (v14 stable)
{
  id: string,
  accountId: string,

  amount: number,
  classification: "revenue" | "expense" | "investment",

  description: string,

  date: timestamp, // timezone-safe (midday normalized)

  category: string, // categoryId

  method?: "pix" | "credit_card" | "transfer" | "cash",

  responsibleUserId?: string,

  installment?: {
    current: number,
    total: number
  },

  createdAt: timestamp
}
🏷️ Categories System (NEW — NORMALIZED TAXONOMY)
📂 Collection: categories
{
  name: string,
  key: string, // normalized slug
  createdAt: timestamp
}
Seeded Categories
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
🧠 Categories System Behavior
Hook
useCategories()
Behavior
Real-time Firestore listener
Ordered by name
Shared across:
AddTransactionDialog
AddBudgetDialog
Key Design Decision
Transactions store categoryId
UI resolves name via categories collection

👉 This enables financial analytics later

💳 Budget System (NEW)
Budget Model
{
  accountId: string,
  category: string, // categoryId
  limit: number,
  period: "monthly",
  createdAt: timestamp
}
Budget Features (v14)
Category selection from Firestore
Inline category creation support
Account-scoped budgets
Monthly limit tracking
🧾 AddTransactionDialog (v14)
Core Features
Create + Edit transactions
Fully controlled form
Category system (Firestore-driven)
Installments fully supported
Category Handling
Uses categoryId
No free-text categories anymore
Ensures normalization across system
Installments System
installment: {
  current: number,
  total: number
}

Rules:

total ≥ 2
1 ≤ current ≤ total
Only enabled for credit_card
UX Improvements
Edit mode prefill
Diff-aware editing
Validation layer
Safe date handling (midday normalization)
Submission locking (prevents double writes)
🧾 AddBudgetDialog (v14)
Features
Select category from Firestore
Inline category creation (planned UX expansion)
Monthly budget limits
Account-scoped storage
📊 Goals System (NEW FOUNDATION)
Status
Route exists
Firestore collection implied: /goals
Requires same accountId pattern as budgets
Expected Model
{
  accountId: string,
  name: string,
  target: number,
  current: number,
  category?: string,
  createdAt: timestamp
}
📱 UI Structure
Layout
DashboardLayout
Bottom Navigation
FAB (context-aware actions)
Screens
Overview
Transactions
Budget
Goals (NEW - in progress)
Settings (simplified)
🔐 Firestore Rules (CURRENT STATE)
Strength
Account-based access control exists
Transaction scoping works
Budget rules introduced
Weak Points (Important)
Category creation is open (intentional but unsafe long-term)
No schema validation layer
No role system yet (owner/member/viewer)
No batch atomic operations
⚠️ Known Gaps (v14)
🔴 Critical
Firestore rules not fully hardened
Goals rules must match budgets pattern strictly
No validation layer (Zod missing)
🟡 Medium
No duplicate category protection
No budget aggregation engine
No analytics layer yet
🟢 Low
UI polish
Category autocomplete UX improvement
Insights dashboard missing
🚀 Major Achievements (Updated)
Core Stability
Multi-account architecture stable
Real-time sync fully working
AccountContext reliable
Data Integrity
Fixed timezone bug (critical fintech issue)
Normalized transaction schema
Introduced category system (major milestone)
UX Improvements
Edit transaction flow fully working
Diff-aware editing UX
Installment system stable
System Evolution
Free-text categories → structured taxonomy
Firestore metadata layer introduced
Financial modeling foundation established
🧭 Current Development Phase

👉 System hardening + financial data normalization

Focus:

data consistency
schema enforcement
scalable financial modeling
analytics preparation
🧭 Immediate Next Steps
1. 🔐 Security Hardening (HIGH PRIORITY)
Fix Firestore rules (categories + goals consistency)
Introduce role system
Lock category creation strategy
2. 🧱 Data Integrity Layer
Prevent duplicate categories
Normalize category keys strictly
Add validation layer (recommended: Zod)
3. 💳 Budget Engine Evolution
Monthly spending aggregation
Budget vs actual comparison
Progress indicators
4. 🎯 Goals System (NEXT FEATURE)
Savings tracking
Progress visualization
Link goals → budgets → categories
5. 📊 Analytics Layer (NEXT PHASE)
Category breakdowns
Monthly trends
Financial insights engine
🧠 Strategic Insight (Updated)

You are now beyond CRUD.

👉 The system is transitioning into:

🧠 A structured financial intelligence model

Because now:

categories are normalized entities
budgets are structured constraints
transactions are typed financial events
accounts are scoped ledgers

👉 This is the foundation of a fintech-grade system.