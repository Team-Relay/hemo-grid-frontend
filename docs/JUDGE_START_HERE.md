# HemoGrid | Judges' guide

> **The closest blood bank is not always the right one.**

**Team Relay · Terumo BCT Africa Hackathon 2026 · Emergency request and dispatch**

HemoGrid is a working, human-in-the-loop emergency red-cell dispatch prototype. It brings **recorded stock**, **configured blood-group eligibility**, **quarantine and cold-chain checks**, and **shared-inventory planning** into the decisions hospital and blood-bank staff actually make. A nearest-bank result alone is not enough.

| Open the prototype | Inspect the build | See proof it works |
| --- | --- | --- |
| **[Launch HemoGrid](https://hemogrid-eight.vercel.app/login)** | [Frontend source](https://github.com/Team-Relay/hemo-grid-frontend) · [Backend source](https://github.com/Team-Relay/hemo-grid-backend) | [Hosted transaction audit](https://github.com/Team-Relay/hemo-grid-frontend/actions/runs/42952475072) |

**Scope:** A synthetic Kenyan demonstration, **not** clinical software. No real patient or donor records, calibrated travel times, automated clinical clearance, or physical blood transfer are claimed.

## 90-second walkthrough

| Workspace | What to inspect | What the system actually does |
| --- | --- | --- |
| **1 · Network coordinator** | Sign in as **Platform admin** → **Joint dispatch planner** | Preview assignments for **2–5 staff-approved critical red-cell requests** that may need the same limited inventory. Compare the result with sequential nearest-eligible selection. Preview **does not reserve stock**. |
| **2 · Hospital officer** | Choose **Hospital** → Requests → Candidate providers | Create a synthetic request, inspect proposed groups and recorded availability, select an eligible supplier, or change the selection while pending. |
| **3 · Blood-bank officer** | Choose **Blood bank** → Assigned requests → Inventory | Accept and reserve an assigned request, then advance **PREPARING → IN_TRANSIT → DELIVERED**. Server-side checks enforce stock and state transitions. |

The login page prefills credentials for the selected **synthetic demonstration role**. For a walkthrough that does **not** alter inventory, inspect the seeded records and planning interface. The controlled create-to-deliver test has already been executed once and is independently auditable.

## One product, two repositories

| Responsibility | Location | Why separated |
| --- | --- | --- |
| **User experience and workflow** | [hemo-grid-frontend](https://github.com/Team-Relay/hemo-grid-frontend) | Next.js, TypeScript, role-specific pages, API client, browser tests and Vercel deployment |
| **Decisions, safety gates and evidence** | [hemo-grid-backend](https://github.com/Team-Relay/hemo-grid-backend) | Spring Boot, PostgreSQL, JWT access control, deterministic ranking, batch planner, Flyway, test/benchmark scripts and Render deployment |

**Both repositories are part of the same submission.** They are not independent products.

~~~mermaid
flowchart LR
  H[Hospital officer] --> UI[Next.js workspace]
  B[Blood-bank officer] --> UI
  C[Coordinator] --> UI
  UI --> API[JWT-protected Spring Boot API]
  API --> RULES[Group, stock and cold-chain checks]
  API --> PLAN[Constrained joint planner]
  API --> STATE[Staff actions and reservations]
  RULES --> DB[(PostgreSQL)]
  PLAN --> DB
  STATE --> DB
~~~

A coordinator recommendation is **advisory**. Hospital staff select a supplier. The bank accepts before stock is reserved. Reservations and requests are protected against conflicting concurrent actions, and delivery reconciles inventory.

## Evidence, with its limits

| What we tested | Verifiable result | Where to inspect |
| --- | --- | --- |
| **Actual hosted transaction** | Hospital created and selected; blood bank accepted, reserved, prepared, marked in transit and delivered. **One synthetic A+ unit** was consumed: **10 → 9 available**, with **0 reserved** after delivery | [Completed Actions audit](https://github.com/Team-Relay/hemo-grid-frontend/actions/runs/42952475072) · [Safety protocol](CONTROLLED_DEMO_REHEARSAL.md) |
| **Deployed roles and browser experience** | Hosted sign-in, authorization, role navigation, and mobile/no-scroll login checks passed | [Hosted browser and API suite](https://github.com/Team-Relay/hemo-grid-frontend/actions/runs/42957499126) |
| **Backend correctness** | Spring/PostgreSQL regression checks and planner verification passed | [Backend Actions](https://github.com/Team-Relay/hemo-grid-backend/actions/runs/42944446515) |
| **Distance-only eligibility** | On **1,072 synthetic emergency red-cell request shapes**, the nearest-site proposal failed at least one configured eligibility check in **749 cases** | [Full benchmark definitions and reproductions](https://github.com/Team-Relay/hemo-grid-backend#ai-and-data) |
| **Scarce-stock coordination** | In one stock-capped five-request benchmark, joint planning completed **150/214** batches versus **146/214** for sequential nearest eligible, with **4.96% lower paired estimated journey hours** among batches completed by both | [Backend evaluation and limitations](https://github.com/Team-Relay/hemo-grid-backend#ai-and-data) |

**Do not misinterpret these results.** Nearest-*eligible* and HemoGrid both proposed full-quantity suppliers for **1,044/1,072** independent request shapes. On the same eligible subset, HemoGrid's exact-group preference increased mean estimated travel from **4.359 to 4.589 hours**. Improvements depend on the scenario and chosen objective. None of these synthetic estimates is a measured arrival time or a clinical outcome.

## Engineering decisions worth examining

- **The decision is inspectable.** Matching uses deterministic configured policies, recorded stock and quarantine exclusions, estimated transit and explicit reasons. No generative model decides which blood to dispatch.
- **Scarce stock is shared, not double-counted.** The joint preview considers multiple mandatory requests together. Bank acceptance performs a separate inventory reservation with database locking; stale or conflicting actions are rejected.
- **Human authority stays explicit.** Coordinators preview, hospitals select and supplying banks accept. The interface does not infer a clinical approval from the planner output.
- **Safety evidence can be absent.** Unknown or failed cold-chain data is not displayed as verified. The UI blocks unsupported selection; the backend rechecks at the commitment boundary.
- **The scaling path is realistic, not claimed complete.** HL7 FHIR, ISBT 128 and DHIS2 are *integration targets*, not implemented conformance. The current service is a modular monolith over aggregate synthetic stock.

## What would be needed for a pilot

Real facility authorization, local transfusion-service protocol validation, unit-level labeling/traceability, actual inventory and temperature integrations, empirical journey-time estimates, monitored operation, audit and access governance, and connectivity fallbacks. No automatic pilot readiness or patient-safety conclusion is implied.

## Demo and submission resources

| Item | Link |
| --- | --- |
| Live web app | [hemogrid-eight.vercel.app](https://hemogrid-eight.vercel.app/login) |
| Full frontend README (setup, roles, results and team) | [Frontend project README](https://github.com/Team-Relay/hemo-grid-frontend#readme) |
| Backend setup, endpoints, evaluations | [Backend README](https://github.com/Team-Relay/hemo-grid-backend#readme) |
| Detailed planning contract | [Dispatch planning API](https://github.com/Team-Relay/hemo-grid-backend/blob/main/docs/DISPATCH_PLANNING.md) |
| Hosted API docs | [Swagger UI](https://hemo-grid-backend.onrender.com/swagger-ui.html) |
| Three-minute video | To be linked after recording |
| Eight-slide pitch deck | To be linked after finalization |

## Team Relay

| Member | Focus |
| --- | --- |
| **Grold Otieno** | ML and AI research; Epidemiology and Biostatistics · Kenya |
| Dennis Ikechukwu Okwuchukwu | Team lead; full-stack and systems engineering · Nigeria |
| Mubarak Zubair | Product management and clinical data analysis · Nigeria |

**The code is public for evaluation.** The projects currently have no root LICENSE file; public availability is not a grant of unrestricted reuse. AI-assisted development was used for implementation support, review and documentation, with team accountability and reproducible tests described in the repository READMEs.
