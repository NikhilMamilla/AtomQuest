# 🎯 AtomQuest — Enterprise Performance & OKR Tracking Portal

> **Designed and Engineered with Excellence by Nikhil Mamilla**  
> *A high-fidelity, secure, and production-ready enterprise OKR management portal that streamlines quarterly employee reviews, goal weightage compliance, and audit-ready SLA tracking.*

---

## 🚀 Executive Project Summary

**AtomQuest** is a premium full-stack enterprise performance dashboard designed to eliminate the friction of traditional organizational goal-setting and manager reviews. Built specifically to secure a **Top 10** position in Hackathon 1.0, the portal bridges high-end visual micro-interactions with advanced ACID-compliant database locking patterns.

Key business objectives solved by AtomQuest:
- **100% Goal Compliance**: Mandatory weight validation ensures employee OKRs sum to precisely 100%.
- **Immutable Audit Ledgers**: State modifications are recorded using a flexible JSONB diff comparison layout.
- **Distributed Lock Management**: Advisors, transaction queues, and workers ensure zero double-execution of SLAs.

---

## 🛠️ Advanced Tech Stack & Architecture

### **1. Frontend (High-End Client Interface)**
- **Framework**: `React 18` + `TypeScript` + `Vite` for blistering compilation.
- **Styling**: `Tailwind CSS` for glassmorphic elements and strict color scales.
- **Animations**: `Framer Motion` for fluid active pill navigation and responsive scale shifts.
- **Icons**: `Lucide React` for interactive status rendering.

### **2. Backend (Secure API Layer)**
- **Server**: `Node.js` + `Express` with custom security middlewares.
- **Database**: `PostgreSQL` (hosted via Neon Serverless) for robust relational models.
- **Authentication**: `JWT` + `Bcrypt.js` for secure password hashing and role enforcement.
- **Automation**: `Node-Cron` + advisory transaction checks for SLA cron dispatches.

---

## ✨ Outstanding Core Features

### 💎 **1. Custom Scroll-Aware Pill Navigation**
- A floating capsule-style navbar that tracks viewport scroll velocity.
- Smoothly hides on scroll-down and animates back on scroll-up.
- Highlight bubbles track hovered navlinks dynamically using Framer Motion.

### 🎮 **2. One-Click Interactive Sandbox Access**
- Three sandbox profiles pre-seeded with custom mock data:
  - 👤 **Sreemouna** (Employee Role)
  - 👥 **Hansika** (Manager Role)
  - 🔑 **Nikhil** (Admin & HR Role)
- Profiles feature custom **interactive Copy/Check cards** that provide instant credentials transfer with green visual feedback on click.

### ⏱️ **3. Live System Execution Pipeline & Terminal**
- Interactive system pipeline detailing how Sreemouna, Hansika, and Nikhil interact with databases, rules, and crons.
- Features an **interactive terminal console** rendering simulated DDL outputs, AST plagiarism cosine indices, SQL ACID lock streams, and raw JSONB deltas corresponding to each active node.

### 📊 **4. Dynamic Business ROI Calculator**
- An interactive calculator that translates active employee counts (10 to 5,000) into actual corporate metric forecasts.
- Sliding employee metrics calculate:
  - **Overhead Hours Saved** (admin time reclaimed).
  - **Projected Cost Savings** ($45/hr administrative value).
  - **Strategic Alignment Boost** (employee transparency index).
  - **Audit Accuracy Rating** (compliant audit accuracy rating).

### ⚙️ **5. Technical Deep-Dive FAQ**
- An elegant collapsible accordion answering high-fidelity system design bottlenecks:
  - *ACID Transaction Row Locks* (`FOR UPDATE`) for cascading parent-child goals.
  - *JSONB Delta Ledger* replacing bulky history audit tables.
  - *AST Plagiarism Queues* preventing main event-loop blocking.
  - *Postgres Advisory Locks* preventing double SLA cron dispatches.

### 🌐 **6. Premium Corporate Enterprise Footer**
- A responsive corporate footer structured cleanly over a 12-column grid layout, featuring branding, platform links, active compliance indicators, and professional developer badges.

---

## 📁 Repository Directory Structure

```text
AtomQuest/
├── backend/
│   ├── src/
│   │   ├── db/            # Postgres Connection Configuration
│   │   ├── jobs/          # SLA Advisories and Cron Routines
│   │   ├── middleware/    # Auth & Role Enforcement Guardrails
│   │   ├── routes/        # CRUD endpoints (Goals, Audits, Check-ins)
│   │   └── index.js       # Express Server Bootstrap
│   ├── .env.example       # Backend environmental variables template
│   └── package.json       
├── frontend/
│   ├── src/
│   │   ├── components/    # Reusable UI & Layout Components
│   │   ├── pages/         # Page Templates (Landing page, Admin, Manager, etc.)
│   │   ├── services/      # API Axios connections
│   │   └── main.tsx       # Vite App Bootstrapper
│   ├── .env.example       # Frontend environment template
│   ├── tailwind.config.js # Color themes & styles
│   └── package.json
├── .gitignore             # Root git exclusions file
└── README.md              # Project Documentation (This File)
```

---

## 🚀 Getting Started (Local Installation)

### **Prerequisites**
Make sure you have [Node.js](https://nodejs.org) and [Git](https://git-scm.com) installed.

### **1. Clone and Configure**
```bash
git clone https://github.com/NikhilMamilla/AtomQuest.git
cd AtomQuest
```

### **2. Setup Backend Secrets**
Navigate to `/backend`, duplicate `.env.example` as `.env`, and add your values:
```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

### **3. Setup Frontend**
Navigate to `/frontend`, duplicate `.env.example` as `.env`, and add the Vite server url:
```bash
cd ../frontend
cp .env.example .env
npm install
npm run dev
```
Open **`http://localhost:5173`** in your browser to view the gorgeous interface.

---

## 🏆 Hackathon Compliance & Validation

The entire system compiles with absolutely zero type warnings, warnings, or syntax desynchronization:
```bash
# Verify Frontend Types
npx tsc --noEmit
# Result: SUCCESS (0 errors)
```

---

## 👥 Developer & Credits

Designed, architected, and coded with absolute passion by:
* **Nikhil Mamilla**
* *Full-Stack Software Architect & Lead Engineer*
* Hackathon 1.0 • v1.2.0

---
*Copyright © 2026 AtomQuest Portal. All Rights Reserved.*
