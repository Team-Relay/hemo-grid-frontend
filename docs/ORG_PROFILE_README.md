<!--
  TEAM RELAY ORGANIZATION PROFILE
  Publish this Markdown as: Team-Relay/.github/profile/README.md
  The profile repository must be public for GitHub to display it on the
  organization's Overview page. This file in the frontend repository is the
  approved publication source, not itself the active organization profile.
-->

<div align="center">

# HemoGrid

### The closest blood bank is not always the right one.

**Emergency blood dispatch · Team Relay · Terumo BCT Africa Hackathon 2026**

[**Launch the live prototype**](https://hemogrid-eight.vercel.app/login) · [**Start here: judges' guide**](https://github.com/Team-Relay/hemo-grid-frontend/blob/main/docs/JUDGE_START_HERE.md) · [**Frontend**](https://github.com/Team-Relay/hemo-grid-frontend) · [**Backend**](https://github.com/Team-Relay/hemo-grid-backend)

</div>

---

### The problem

The nearest blood bank may not have enough **eligible, dispatchable red cells**. During concurrent emergencies, hospitals can also compete for the same inventory.

**HemoGrid makes those constraints visible before the handoff.** It links hospital requests, staff-reviewed supplier proposals, blood-bank reservations and a coordinator's joint dispatch preview in one working prototype.

### One request. Three accountable workspaces.

| 01 · Hospital | 02 · Network coordinator | 03 · Blood bank |
| :--- | :--- | :--- |
| Requests blood; reviews stock and eligibility; selects the supplier | Compares assignments for **2–5 staff-approved requests** competing for shared stock | Accepts and reserves stock; records preparation, transit and delivery |

### A working system, not just screens

- **Hosted transaction completed:** A synthetic A-positive red-cell request went from **created → selected → accepted/reserved → preparing → in transit → delivered**. Available stock reconciled from **10 to 9 units**, with no outstanding reservation. [Inspect the audit](https://github.com/Team-Relay/hemo-grid-frontend/actions/runs/42952475072).
- **Repeatable, bounded planning:** An explicit solver evaluates shared-stock assignments and reports infeasibility or search limits instead of silently inventing solutions. [Read the technical results](https://github.com/Team-Relay/hemo-grid-backend#ai-and-data).
- **Real deployed interfaces:** Hospital, blood-bank and coordinator authentication and browser navigation have passed hosted checks. [View verification](https://github.com/Team-Relay/hemo-grid-frontend/actions/runs/42957499126).

### Project source

| Repository | What judges will find |
| :--- | :--- |
| **[HemoGrid frontend](https://github.com/Team-Relay/hemo-grid-frontend)** | Next.js, TypeScript, three role workspaces, browser checks and the main submission README |
| **[HemoGrid backend](https://github.com/Team-Relay/hemo-grid-backend)** | Spring Boot, PostgreSQL, JWT, stock protection, dispatch planner, APIs, database migrations and reproducible evaluations |

**[Read the complete two-minute project tour](https://github.com/Team-Relay/hemo-grid-frontend/blob/main/docs/JUDGE_START_HERE.md)** for the demo path, architecture, benchmark tradeoffs, tests, limitations and local setup.

### Team

**Grold Otieno** · AI/ML research, Epidemiology and Biostatistics (Kenya)  
**Dennis Ikechukwu Okwuchukwu** · Team lead, full-stack/systems engineering (Nigeria)  
**Mubarak Zubair** · Product management and clinical data analysis (Nigeria)

<sub>Built using synthetic Kenyan demonstration data. No real patient/donor records, validated clinical release decisions or physical blood deliveries are claimed. The plan is advisory, and clinical decisions remain with qualified staff.</sub>
