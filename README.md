# Lala Ops — Internal Operations & Triage Suite

> **Functional Internal Operations Management System for Lala Tech LLC**  
> Engineered from the Product Resource Document (`docs/lala-ops-technical-resource.md`) and the Stitch UI/UX design suite.

---

## 🌟 Overview

Lala Ops resolves the three critical points of operational failure when handling client requests across informal channels (WhatsApp, email, customer chat):
1. **Requests get forgotten** because they live in chat threads, not a system.
2. **Ownership is unclear** — no one knows who is supposed to be doing what.
3. **Follow-ups stall silently** because nothing proactively resurfaces stale work.

Lala Ops collapses the conversion effort to **"paste and confirm"** using an AI extraction pipeline, while giving managers real-time visibility and guaranteeing that **"waiting on the client" is never confused with "forgotten by us."**

---

## 🚀 Quick Start

### Option 1: PowerShell Local Server (Recommended)
Clone the repository and launch the built-in zero-dependency server:

```powershell
git clone https://github.com/rxra01/lala-ops.git
cd lala-ops
powershell -ExecutionPolicy Bypass -File .\serve.ps1 -Port 3000
```

Open your browser at **`http://localhost:3000/`**.

### Option 2: Direct File Open
You can also open `index.html` directly in modern web browsers (Chrome, Edge, Firefox, Safari).

---

## 🧭 Core Screens & Workflow

### 1. Manager Operations Dashboard
- **The 4 Visibility Buckets** (PRD Section 10):
  - **Bucket 01 — Waiting for Us**: Untriaged (`new_request`), unassigned (`ready_to_assign`), or stale `in_progress` tasks (&gt; 3 days without update).
  - **Bucket 02 — Waiting for Client**: Tasks in `needs_clarification` or `waiting_on_client` — **explicitly suppressed from overdue alerts**, tracking elapsed pause time with the SLA clock paused.
  - **Bucket 03 — Unassigned**: Quick cross-check of all unclaimed tasks (`isUnassigned == true`).
  - **Bucket 04 — Overdue**: Breached SLA deadlines, strictly excluding client holds.
- **Team Workload & Priority Breakdowns**: Live operational counts across employees and priority tiers.
- **Hero Scenario 1-Click Runner**: Click **`Run Hero Demo Beat`** in the dashboard header to watch the end-to-end contact form triage flow in action.

### 2. Requests Inbox & AI Extraction Pipeline
- **Split Triage Workspace**: Left stream of raw incoming messages (WhatsApp, email, chat) paired with a right inspection pane.
- **AI Extraction Pipeline**: Turns messy free text into structured JSON matching PRD Section 8 (`title`, `customer`, `category`, `priority`, `deadline`, `followUpDate`, `suggestedAssigneeName`, `confidence`).
- **Human-in-the-Loop Review**: Editable review modal allowing managers to verify/tweak entities before creating tasks.
- **Clarification Beat 1-Click Runner**: Click **`Run Clarification Beat`** to test handling ambiguous client requests.

### 3. Employee "My Work" Queue
- Dedicated personal view for **Rahul Sharma** (or any active employee).
- Separates active execution (*In Progress*, *Due Today*) from *Waiting on Client* (paused timer, calm amber badge, zero SLA pressure).
- **Inline Quick Status Buttons**: 1-click toggles (*Wait on Client*, *Resume Work*, *Mark Done*) directly on task cards.

### 4. Unified Task Details & Activity History
- Complete task lifecycle management (`new_request` → `needs_clarification` → `ready_to_assign` → `in_progress` ⇄ `waiting_on_client` → `done`).
- Dynamic assignee selector and linked raw request drawer.
- **Interactive Notes & Clarification Thread**: Records questions asked and client credentials provided.
- **Immutable Chronological Activity Log**: Pre-rendered human-readable audit trail ("Sarah Jenkins assigned task to Rahul Sharma", "Rahul moved to Waiting on Client: SLA alert paused").

---

## 🏛️ Project Architecture

```
lala-ops/
├── index.html         # Application shell: Top navigation, 5 views, modals, command palette
├── css/
│   └── styles.css     # Ops Core Design System: Tokens, semantic status badges, layout utilities
├── js/
│   ├── db.js          # Reactive document store (users, requests, tasks, comments, activityLog, notifications)
│   ├── ai.js          # AI extraction client (Gemini target schema, semantic parser, manual fallback)
│   └── app.js         # View router, role switching, dashboard calculations, demo runners
├── assets/            # Vector logo SVG and avatars
├── docs/
│   └── lala-ops-technical-resource.md # Technical PRD & specifications
├── serve.ps1          # Zero-dependency PowerShell HTTP server (Port 3000)
└── README.md
```

---

## 👥 Demo Profiles & Role Switching

Switch roles anytime using the top-right profile dropdown:
- **Sarah Jenkins** (`user-mgr-1`) — Manager (Full triage, dashboard, team dispatch, request intake).
- **Rahul Sharma** (`user-emp-1`) — Employee (Support & Technical Specialist, My Work queue, status transitions).

---

## 📄 License
Internal Operations Suite — Built for Lala Tech LLC.
