# Team Relay: HemoGrid emergency blood dispatch

> ### The closest blood bank is not always the right one.

**Terumo BCT Africa Hackathon 2026 · Emergency request and dispatch**

**[Launch the live prototype](https://hemogrid-eight.vercel.app/login)** · **[Judges: start here (2 minutes)](docs/JUDGE_START_HERE.md)** · [Backend and evaluation](https://github.com/Team-Relay/hemo-grid-backend) · [Verified hosted transaction](https://github.com/Team-Relay/hemo-grid-frontend/actions/runs/42952475072)

**Judge access:** [Open the demo](https://hemogrid-eight.vercel.app/login), select **Hospital**, **Blood bank** or **Platform admin**, and click **Continue to workspace**. The role's synthetic email and password are **already filled in**. **Do not enter personal credentials.** [See the 90-second guide](docs/JUDGE_START_HERE.md).

**One working system. Three accountable roles.** A hospital requests blood, a network coordinator can preview supplier allocations across competing emergencies, and a blood bank verifies and reserves the stock before fulfilment. HemoGrid evaluates recorded inventory, configured group rules, quarantine evidence and estimated routes rather than distance alone.

**Why it matters:** In a controlled synthetic benchmark of 1,072 red-cell requests, a nearest-site choice failed at least one configured eligibility check for **749 requests**. [See the method, baselines and tradeoffs](https://github.com/Team-Relay/hemo-grid-backend#ai-and-data). This is **not** a clinical outcome or a measured delivery-time improvement.

**Repository guide:** This is the **project's main overview and frontend**. The [backend repository](https://github.com/Team-Relay/hemo-grid-backend) contains the API, inventory transactions, planner and reproducible evaluation. Both repositories form **one submission**. For the fastest review, open the [judges' guide](docs/JUDGE_START_HERE.md).

*All scenarios are synthetic. The prototype does not replace clinical crossmatching, staff authorization or physical dispatch.*

---

## The problem

Finding the nearest facility does not establish whether enough usable blood is available, whether the facility can supply it, or whether a transfer can be arranged. Under scarcity, independent hospital decisions can also compete for the same stock. The prototype makes these constraints visible before staff coordinate a transfer.

The source dataset is a synthetic Kenyan network. All results below refer to prototype checks under explicit assumptions, not measured clinical outcomes.

## What we built

One authenticated web application provides three connected workspaces:

1. **Hospital officer**: create a request, review ranked suppliers and rationale, choose or change a provider while pending, cancel where allowed, and follow the fulfilment lifecycle.
2. **Blood-bank officer**: see organization-scoped assignments, accept and reserve available units, decline, progress preparation/transit/delivery, and review/update recorded stock.
3. **Network coordinator**: preview a joint supplier plan for two to five staff-approved critical red-cell requests, compare it with a sequential nearest-eligible baseline, and copy a supplier handoff. Preview does not modify stock.

The frontend uses Next.js 16, React 19 and TypeScript. The backend uses Spring Boot with PostgreSQL, JWT authorization and Flyway migrations. The frontend maps authoritative backend DTOs into UI models; it does not implement its own clinical compatibility or reservation rules.

### What works now

- Role-based login and organization-scoped pages.
- Hospital requisition, supplier evidence and request lifecycle screens.
- Blood-bank reservation and status controls with server revalidation.
- Recorded cold-chain and quarantine evidence, including explicit unavailable states instead of fabricated safety readings.
- Coordinator joint planning view with solver status, shared-stock evidence and comparative estimated journey hours.
- Clear treatment of stale or conflicting updates, including a concurrent-modification response.
- Automated frontend unit, lint, type and production-build verification in GitHub Actions.
- A complete hosted synthetic create → select → accept/reserve → prepare → transit → deliver transaction with reconciled inventory balances.

### Verified hosted synthetic transaction

A controlled GitHub Actions rehearsal completed **hospital create → supplier select → bank accept/reserve → PREPARING → IN_TRANSIT → DELIVERED** against the deployed Render API on 11 November 2026. The supplying demo bank reserved one A-positive red-cell unit, and stock accounting reconciled from **10 available / 0 reserved** to **9 available / 0 reserved** after delivery. The hospital's authoritative request status was DELIVERED.

[View the successful live transaction audit](https://github.com/Team-Relay/hemo-grid-frontend/actions/runs/42952475072) · [Rehearsal safeguards](docs/CONTROLLED_DEMO_REHEARSAL.md)

This was **a synthetic software lifecycle test**, not an actual shipment, clinical crossmatch, or patient outcome. Its routine one-unit request was kept out of the coordinator's critical-emergency queue.

### What is simulated or not finished

- Stock, temperature logs, routes, power events and request history originate from synthetic starter data, not live clinical systems.
- Corridor travel times are estimates; live traffic, observed trip times and uncertainty calibration are not integrated.
- The core workflow demonstrates red-cell dispatch. Clinical crossmatching, unit-level traceability, expiry release decisions and validation for other blood products remain outstanding.
- Coordinator planning is **advisory**. It does not approve requests, accept an order on behalf of a hospital, reserve stock, or dispatch automatically.
- Some administrative network overview screens contain labeled demonstration fixtures and should not be presented as live inventory.
- SMS, USSD, full offline use and live sensor ingestion are future integrations.

### Live links and demonstration

| Resource | URL or status |
| --- | --- |
| Primary project guide | [Judges: start here](docs/JUDGE_START_HERE.md) |
| Frontend | [HemoGrid web app](https://hemogrid-eight.vercel.app) |
| Backend | [API health](https://hemo-grid-backend.onrender.com/actuator/health) |
| API reference | [Swagger UI](https://hemo-grid-backend.onrender.com/swagger-ui.html) |
| Backend source and evidence | [Team-Relay/hemo-grid-backend](https://github.com/Team-Relay/hemo-grid-backend) |
| Video (3 minutes maximum) | Recording link pending |
| Pitch slides (8 maximum) | Deck link pending |

The public frontend and backend have passed [hosted three-role API and browser checks](https://github.com/Team-Relay/hemo-grid-frontend/actions/runs/42957499126), including compact desktop and mobile login layouts. Live availability should still be checked before presenting.

**Synthetic demonstration logins:** Hospital `hospital.demo@hemogrid.local` / `HospitalDemo123!`; bank `bank.demo@hemogrid.local` / `BankDemo123!`; coordinator `admin.demo@hemogrid.local` / `AdminDemo123!`. Additional regional bank accounts are documented in the backend README. Do not use these shared passwords with real data.

## How to run it

Requirements: Node.js 22 and npm, plus a running HemoGrid backend and its database.

~~~bash
git clone https://github.com/Team-Relay/hemo-grid-frontend.git
cd hemo-grid-frontend
cp environment.example .env.local
npm ci
npm run dev
~~~

Open `http://localhost:3000`. The sample configuration targets a local backend at `http://localhost:8080/api/v1`. For a hosted deployment, set `NEXT_PUBLIC_HEMOGRID_API_URL` and `HEMOGRID_API_URL` to the appropriate API base, including `/api/v1`. Browser requests can see the public variable; never put secrets in it.

Verification:

~~~bash
npm run lint
npx tsc --noEmit
npm test
npm run build
~~~

The browser end-to-end suite requires a running frontend and backend; use `npm run test:e2e` in that environment. Backend deployment and database migration checks are separate from frontend CI. The [controlled hosted lifecycle rehearsal](docs/CONTROLLED_DEMO_REHEARSAL.md) has its own explicit synthetic-only gate and audit trail.

## Architecture

~~~mermaid
flowchart TD
    Hospital[Hospital officer] --> UI[Next.js role workspace]
    Bank[Blood-bank officer] --> UI
    Coordinator[Network coordinator] --> UI
    UI --> Typed[Typed API client and DTO mappers]
    Typed --> API[Spring Boot authenticated REST API]
    API --> Rules[Compatibility and inventory checks]
    API --> Plan[Joint dispatch planner]
    API --> Workflow[Staff approval and reservation lifecycle]
    Rules --> DB[(PostgreSQL)]
    Plan --> DB
    Workflow --> DB
~~~

JWT bearer tokens are supplied on authenticated API calls. The backend enforces organization ownership and transaction locks; frontend badges and disabled buttons are not substitutes for those server checks. API and frontend handoff: [backend contract](https://github.com/Team-Relay/hemo-grid-backend/blob/main/docs/FRONTEND_API_HANDOFF.md) and [local mapping](docs/API_MAPPING.md).

**Interoperability targets:** HL7 FHIR, ISBT 128 and DHIS2 provide potential integration points. This prototype has no FHIR conformance claim, ISBT 128 labeling implementation, or DHIS2 registry synchronization.

## AI and data

### What the AI or data feature does

The backend implements deterministic eligibility checks, evidence-based provider ranking and constrained joint allocation. A coordinator may preview an assignment of two to five critical red-cell requests under shared stock constraints. A complete plan minimizes the sum of available journey estimates for the included requests. The application reports whether optimality was proven or the search budget was reached. It does not call a remote generative model to make dispatch decisions.

The frontend displays input evidence, limitations, pending staff actions and conflicts. Hospital officers select their own suppliers and supplying banks accept before inventory reservation.

### Baselines and results

Two baselines are evaluated in the backend: nearest active site without inventory screening, and nearest **eligible** site using the same configured availability/quarantine checks. The joint planner is additionally compared with sequential nearest-eligible assignment.

| Reproducible synthetic comparison | Observed result |
| --- | --- |
| Independent emergency red-cell requests with known group | 1,072 request shapes |
| Nearest-site proposals failing configured eligibility checks | 749 / 1,072 |
| HemoGrid eligible full-quantity proposals | 1,044 / 1,072 |
| Nearest-eligible full-quantity proposals | 1,044 / 1,072 |
| Five-request batches completed under stock-capped scarcity: sequential vs joint planner | 146 / 214 vs 150 / 214 |
| Paired estimated journey-hour reduction, completed by both methods under stock cap | 4.96% |

On the unchanged seeded stock snapshot, both batch methods complete 187/214 five-request groups and the paired transport difference is only 0.20%. The independent-request comparison also shows a tradeoff: on the same 1,044 eligible requests, HemoGrid's exact-group preference has a **longer** mean estimated transit (4.589 hours) than nearest eligible (4.359 hours). That result should not be presented as a demonstrated reduction in emergency delivery time.

The figures measure configured checks and synthetic route estimates. They do not establish patient outcomes, clinical suitability, actual arrival times, or generalization beyond the supplied scenarios. See the [reproducible backend results](https://github.com/Team-Relay/hemo-grid-backend#ai-and-data).

### How recommendations are explained and approved

Candidate views present recorded available stock, offered blood group, match type, quarantine exclusions, cold-chain status when supplied, ranking reasons and estimated journey time. Missing evidence is shown as unavailable. Hospital staff approve a provider selection; the bank confirms acceptance before reservation. Both operations recheck server-side state. When requests or stock change, the UI surfaces the conflict and asks staff to refresh.

### If the system is unavailable

There is no complete offline workflow. Staff must revert to their established telephone and manual coordination processes. The interface must never imply that an unconfirmed proposal or stale stock value constitutes clinical clearance.

## Data

The synthetic Kenyan starter dataset imported by the backend includes 47 facilities, 2,162 route records, 225 aggregate inventory rows and 2,500 historical request records. The reproducible independent-request cohort is a defined subset, not the entire dataset. No real donor or patient records are intended for this demonstration.

The hackathon brief permits use of the supplied synthetic dataset but does not state a separate data licence in the technical phase brief. Check the Applicant's Kit for any further restrictions. This frontend repository currently has **no project LICENSE file**; source visibility alone does not grant blanket reuse rights.

## African conditions

The design works with compact REST/JSON exchanges and explicit retry/refresh handling after network interruptions. Accurate offline synchronization, SMS fallbacks, cold-chain sensor input and empirical low-bandwidth performance remain unimplemented. A rollout in another jurisdiction would need locally validated clinical protocols, facility data, language support and governance.

## AI tools we used

Team Relay owns the problem definition, implementation decisions, test interpretation and submission. Development involved AI-assisted code completion, implementation suggestions, debugging, review and documentation. Tools used across team work included Google Antigravity/Gemini/Claude, GitHub Copilot, ChatGPT and Codex. AI assistance does not replace the executable regression suite, reproducible benchmark or team accountability for results.

## Team

| Member | Role | Country | Presentation |
| --- | --- | --- | --- |
| **Grold Otieno** | ML and AI research; Epidemiology and Biostatistics | Kenya | In person, Nairobi |
| Dennis Ikechukwu Okwuchukwu | Team lead; full-stack and systems engineering | Nigeria | Online |
| Mubarak Zubair | Product management and clinical data analysis | Nigeria | Online |

## Known limits and next steps

1. Record a short, staff-led walkthrough of the coordinator's advisory plan and the hospital-to-bank request lifecycle using only synthetic records.
2. Publish the three-minute video and eight-slide pitch deck under the submission template, tying benchmark claims to their exact synthetic denominators.
3. Review and classify npm dependency advisories before any production deployment.
4. Treat clinical validation, real inventory/temperature feeds, unit-level traceability, calibrated travel times and offline/SMS fallbacks as future work.
