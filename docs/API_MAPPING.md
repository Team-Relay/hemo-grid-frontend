# Frontend ↔ backend API mapping

HemoGrid's Spring Boot API is authoritative. Next.js uses typed response adapters, not its own clinical clearance or reservation rules. The backend's [API handoff](https://github.com/Team-Relay/hemo-grid-backend/blob/main/docs/FRONTEND_API_HANDOFF.md) and generated [OpenAPI document](https://hemo-grid-backend.onrender.com/v3/api-docs) take precedence over this overview.

## Request and inventory view models

| Backend | Frontend | Notes |
| --- | --- | --- |
| `id` | `id` | UUID is canonical, including API paths |
| `requester.id` / `.name` | `hospitalId` / `hospitalName` | Organization-scoped authenticated API |
| `provider.id` / `.name` | `providerId` / `providerName` | Nullable until a supplier is selected |
| `unitsRequired` | `units` | Requested units |
| `requestedAt` / `updatedAt` | `createdAt` / `updatedAt` | Original timestamp from API |
| `requestedAt`, `acceptedAt`, `preparingAt`, `dispatchedAt`, `deliveredAt`, `cancelledAt` | `timeline` | Only recorded milestones appear |
| `unitsAvailable` / `unitsReserved` | `availableUnits` / `reservedUnits` | Bank-owned inventory row |
| `dispatchableUnitsFree` | `dispatchableUnitsFree` | **Preferred supply measure**; excludes quarantined/non-dispatchable stock |
| `quarantinedTempExcursionUnits`, `fridgeTempCelsius`, `coldChainStatus` | Same-named optional fields | Missing evidence remains missing, never inferred as a healthy reading |

A display-only reference `HG-` + the first eight UUID characters may appear in the interface. It is **not** an alternate backend identifier and is never submitted to the API. The request's displayed `reservedUnits` is a UI estimate based on the lifecycle, not a ledger; use the inventory endpoint for actual reservation accounting.

For legacy inventory fixtures without `dispatchableUnitsFree`, the UI does **not** display units as dispatchable unless recorded cold-chain conditions allow the conservative calculation.

## Supplier candidate mapping

| API field | UI value or use |
| --- | --- |
| `organizationId`, `organizationName` | Supplier identity |
| `bloodGroup`, `offeredBloodGroup`, `component` | Requested/offered product evidence |
| `unitsFree`, `canFullyFulfil`, `rank` | Snapshot availability and ordering |
| `distanceKm`, `estimatedTransitHours` | Optional estimated travel evidence, never measured ETA |
| `matchType`, `conservationRuleApplied` | Recorded group-rule evidence |
| `coldChainVerified`, `fridgeTempCelsius`, `quarantinedUnitsExcluded` | Recorded safety and quarantine evidence |
| `recommendationReasons` | Backend-provided explanation; absent values show an explicitly labeled fallback explanation |

The backend currently supplies distance and transit estimates for eligible candidates where available. The UI does not fabricate these fields when missing. No live map coordinates or observed journey-time series are provided.

A candidate can be selected in the UI only when **all** of these are affirmative: `canFullyFulfil === true`, `coldChainVerified === true`, and a `matchType` is present. This reduces accidental user actions; **the backend remains the authority**, rechecking current stock and safety on selection and bank acceptance.

## Coordinator planner

`GET /api/v1/dispatch-plans/requests` returns pending critical red-cell requests for the network coordinator.

`POST /api/v1/dispatch-plans/preview` requires **2–5 distinct request UUIDs** and a `staffApproved: true` coordinator declaration. The backend returns a solver status (`OPTIMAL`, `FEASIBLE`, `INFEASIBLE`, `LIMIT_REACHED`), optional complete proposals, the nearest-eligible baseline, travel estimates, visited node count and notes. Preview is advisory and **does not reserve inventory**. See the [planner contract](https://github.com/Team-Relay/hemo-grid-backend/blob/main/docs/DISPATCH_PLANNING.md).

## Errors and time

The API exposes an error envelope with HTTP status, application code, message and optional field errors. In particular, `CONCURRENT_MODIFICATION` and `COLD_CHAIN_HOLD` require a fresh server read and staff reconciliation. The frontend never automatically retries a mutating request after a network failure.

Displayed local dates, including the hospital's "today" summary, use **Africa/Nairobi (EAT)**. Backend timestamps remain canonical. Data is synthetic and does not establish clinical release approval or actual physical delivery.
