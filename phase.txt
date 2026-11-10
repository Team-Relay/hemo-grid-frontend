HEMOGRID FRONTEND INTEGRATION ROADMAP
=====================================

Goal
----
Integrate the existing Next.js frontend with the Spring Boot API using a secure,
server-first architecture while preserving the current UI.

CURRENT STATUS - 25 AUGUST 2026
--------------------------------

Phase 0 frontend foundation: COMPLETE
Phase 1 API and authentication foundation: COMPLETE
Phase 2 hospital read flow: COMPLETE
Phase 3 hospital request and matching flow: COMPLETE
Phase 4 blood-bank provider flow: COMPLETE
Phase 5 blood-bank inventory: COMPLETE
Phase 6 dashboard composition: COMPLETE
Phase 7 testing and production hardening: COMPLETE
Phase 8 code comments and documentation: COMPLETE
Next implementation phase: PHASE 9 - ONBOARDING AND REMAINING API DECISIONS

Verified results:

- TypeScript passes with no errors.
- ESLint passes with no warnings.
- The Next.js production build passes.
- Real Spring Boot login and GET /auth/me succeed.
- Successful login creates an HttpOnly, SameSite=Lax session cookie.
- Invalid credentials return an inline error and do not create a cookie.
- Protected routes redirect unauthenticated users to /login.
- Valid users can access their own workspace and are redirected away from
  workspaces belonging to other roles.
- The application shell displays the authenticated user's real name, role, and
  organization while preserving the existing visual design.
- The hospital dashboard reads the authenticated organization and request list
  from Spring Boot in parallel.
- The hospital request table and detail page no longer use mock request data.
- Empty request collections, missing request IDs, retryable errors, and loading
  transitions have dedicated UI states.
- The request mapper derives lifecycle events from backend timestamps and keeps
  fields missing from the API explicitly unavailable.
- Hospital users can create a validated request through a Server Action, view
  real ranked candidates, and select only a bank that can fully fulfil it.
- Selection eligibility is rechecked by Spring Boot so a stale candidate cannot
  be selected after its free inventory falls below the requested quantity.
- Hospital users can cancel eligible requests through an accessible confirmation
  dialog, with pending and conflict feedback that prevents repeated actions.
- Active request detail pages refresh every five seconds while the tab is visible
  and stop polling after the request reaches a terminal state.
- Provider request and inventory screens use real authenticated Spring Boot data.
- Provider acceptance is concurrency-safe and cannot reserve inventory twice.
- Closing a browser tab preserves a valid session; `/` and `/login` restore the
  user to the dashboard for their role until explicit logout or token expiry.
- Vitest mapper, error, validation, and role tests pass.
- Playwright verifies session restoration, logout, and an accessibility scan.
- All 20 Java 21 integration tests pass against an isolated PostgreSQL database.
- Purpose comments and review documentation cover both repositories.

Current API boundary:

- The hospital network map remains on its existing local visualization data
  because the backend does not expose a general network-facility endpoint.
- Candidate location text, travel estimates, and map coordinates remain
  unavailable because CandidateResponse does not expose those fields.

The frontend error adapter supports the backend's current error response and
optional future code, path, and fieldErrors properties. Richer backend field
errors can be added later without changing the frontend error-handling API.

Architecture
------------

Browser UI
    -> Next.js App Router
        - Server Components for initial reads
        - Server Actions for mutations
        - HttpOnly cookie for the backend JWT
        - Data Access Layer (DAL) for session and role checks
        - DTO mappers between backend responses and frontend view models
    -> Spring Boot REST API using Authorization: Bearer <JWT>
    -> PostgreSQL

The JWT must not be stored in localStorage. Next.js will store it in a secure,
HttpOnly cookie and attach it to server-to-server requests to Spring Boot.

Use a server-only environment variable:

HEMOGRID_API_URL=http://localhost:8080/api/v1

Do not prefix it with NEXT_PUBLIC_ because it is not intended for browser code.


PHASE 0 - API CONTRACT AND UI BASELINE
--------------------------------------

Tasks:

1. Run the existing frontend lint, format, type-check, and production build.
2. Capture important existing screens so visual regressions are easy to identify.
3. Fix existing formatting issues and unused imports without changing the UI.
4. Compare the backend OpenAPI contract with the frontend domain models.
5. Document every backend-to-frontend field mapping.
6. Stabilize the backend error response with status, code, message, path, and
   validation fieldErrors.
7. Add the server-only HEMOGRID_API_URL configuration.

Exit criteria:

- The current frontend builds successfully.
- The UI baseline is preserved.
- API field mappings are documented.
- Error handling has a stable contract.


PHASE 1 - API AND AUTHENTICATION FOUNDATION
-------------------------------------------

Suggested structure:

lib/
  api/
    client.ts
    errors.ts
    backend-types.ts
    mappers.ts
    auth.ts
    blood-requests.ts
    provider-requests.ts
    inventory.ts
  auth/
    session.ts
    dal.ts
    roles.ts
  validation/

Tasks:

1. Build one typed, server-only HTTP client for the Spring Boot API.
2. Normalize network and backend errors in one place.
3. Add request timeouts and safe JSON parsing.
4. Implement login through POST /auth/login.
5. Store the returned JWT in an HttpOnly, SameSite=Lax cookie.
6. Implement logout by deleting the cookie.
7. Verify sessions using GET /auth/me.
8. Redirect users by role:
   - HOSPITAL_ADMIN/HOSPITAL_STAFF -> /hospital/dashboard
   - BLOOD_BANK_ADMIN/BLOOD_BANK_STAFF -> /blood-bank/dashboard
   - PLATFORM_ADMIN -> /admin/dashboard
9. Add proxy.ts for optimistic route redirects.
10. Perform secure session and role checks in the DAL and Spring backend.
11. Preserve the current login design while replacing simulated role login.

Important:

Proxy is only an early redirect layer. It is not the final authorization layer.
The Next.js DAL and Spring API must still protect every operation.

Exit criteria:

- Real backend login and logout work.
- The JWT is inaccessible to browser JavaScript.
- Refreshing a protected page preserves the session.
- Unauthenticated users are redirected to login.
- Users are sent to the correct role-specific area.


PHASE 2 - HOSPITAL READ FLOW
----------------------------

Endpoints:

GET /organizations/me
GET /blood-requests
GET /blood-requests/{requestId}

Tasks:

1. Replace mock hospital request data with backend data.
2. Map BloodRequestResponse into the existing frontend view model.
3. Connect the hospital dashboard, request history, and request details.
4. Derive the request timeline from backend timestamps.
5. Add meaningful skeletons using the existing design.
6. Add empty, not-found, permission-denied, and retryable error states.
7. Preserve the current layouts and styling.

Exit criteria:

- Hospital users see only their organization's real requests.
- Hospital screens no longer import mock request data.
- Loading, empty, error, and not-found states work.
- The UI has no visual regression.


PHASE 3 - HOSPITAL REQUEST AND MATCHING FLOW
--------------------------------------------

Endpoints:

POST /blood-requests
GET  /blood-requests/{requestId}/candidates
POST /blood-requests/{requestId}/select-provider
POST /blood-requests/{requestId}/cancel

Tasks:

1. Validate the request form with a shared schema.
2. Submit requests through a Server Action.
3. Use useActionState for expected form errors and pending state.
4. Navigate with the real request UUID.
5. Replace mock candidates with real matching results.
6. Map CandidateResponse into the existing candidate UI.
7. Make unsupported frontend-only fields optional rather than inventing values.
8. Implement provider-selection and cancellation confirmations.
9. Poll request detail every 3 to 5 seconds.
10. Prevent duplicate submissions and repeated action clicks.

Exit criteria:

Hospital login
    -> create a real blood request
    -> view ranked blood-bank candidates
    -> select a provider
    -> view the real request and current status

Status: COMPLETE (24 August 2026)

Implementation notes:

- Shared Zod validation mirrors the backend enum and length constraints.
- Server Actions keep the JWT on the server and normalize expected API errors.
- Partial candidates remain visible but cannot be selected; one request is not
  silently split across providers.
- Cancellation is available only for REQUESTED, ACCEPTED, and PREPARING states,
  matching the backend rule.
- See docs/HOSPITAL_REQUEST_FLOW.md for the end-to-end file and data flow.


PHASE 4 - BLOOD-BANK PROVIDER FLOW
----------------------------------

Status: COMPLETE (25 August 2026)

The provider in HemoGrid is the selected blood bank.

Endpoints:

GET  /provider/requests
GET  /provider/requests/{requestId}
POST /provider/requests/{requestId}/accept
POST /provider/requests/{requestId}/decline
POST /provider/requests/{requestId}/status

Tasks:

1. Replace mock provider requests with backend data.
2. Connect the blood-bank dashboard, list, and request detail.
3. Implement accept and decline confirmations.
4. Implement ACCEPTED -> PREPARING -> IN_TRANSIT -> DELIVERED.
5. Prevent repeated actions while mutations are pending.
6. Handle insufficient-inventory and invalid-transition conflicts.
7. Refresh data after every mutation.
8. Poll assigned requests for new and updated work.
9. Clearly display terminal states.

Backend prerequisite:

Fix concurrent acceptance so simultaneous calls cannot reserve inventory twice for
one request. Add a concurrency integration test.

Exit criteria:

- The selected bank can see and act on the real request.
- Another bank cannot access or accept it.
- Pending, success, and error feedback is clear.
- The hospital observes provider changes through polling.


PHASE 5 - BLOOD-BANK INVENTORY
------------------------------

Status: COMPLETE (25 August 2026)

Endpoints:

GET   /inventory
PATCH /inventory/{inventoryId}/units

Tasks:

1. Replace mock inventory with real authenticated-bank inventory.
2. Map unitsAvailable -> availableUnits.
3. Map unitsReserved -> reservedUnits.
4. Keep reserved units read-only.
5. Validate available-unit updates.
6. Handle conflicts when available units would be below reserved units.
7. Refresh inventory after acceptance, cancellation, and delivery.
8. Preserve the current filters, table, modal, and responsive styling.

Exit criteria:

- The bank sees and updates its real inventory.
- Reservation changes come only from backend lifecycle operations.
- Existing inventory UI remains intact.


PHASE 6 - DASHBOARD COMPOSITION
-------------------------------

Status: COMPLETE (25 August 2026)

Tasks:

1. Derive hospital metrics from GET /blood-requests.
2. Derive blood-bank metrics from GET /provider/requests.
3. Derive inventory health from GET /inventory.
4. Fetch independent dashboard resources in parallel.
5. Avoid extra endpoints for metrics that can be calculated accurately.
6. Keep unsupported admin data explicitly mocked or unavailable.

Not currently supported by the backend:

- Network-wide inventory browsing
- Admin organization lists and facility details
- Admin dashboard analytics
- Global request oversight
- Forgot-password workflow

Exit criteria:

- Hospital and bank dashboards use real data.
- Independent requests run in parallel.
- Unsupported data is never presented as live data.


PHASE 7 - TESTING AND PRODUCTION HARDENING
------------------------------------------

Status: COMPLETE (25 August 2026)

Tasks:

1. Add unit tests for DTO mappers and error normalization.
2. Add authentication and session tests.
3. Add form-validation and mutation-state tests.
4. Add role-access tests.
5. Add Playwright coverage for the full hospital/provider flow.
6. Add accessibility checks for forms, dialogs, errors, and loading states.
7. Test slow network, offline, timeout, 401, 403, 404, and 409 behavior.
8. Configure production cookie security.
9. Run lint, Prettier, TypeScript type-check, and the production build.
10. Test deployed frontend against deployed Spring Boot API.

Exit criteria:

- Critical flows have automated coverage.
- Expected backend and network failures are handled cleanly.
- The production build succeeds.
- The deployed end-to-end flow works.


PHASE 8 - CODE COMMENTS AND DOCUMENTATION
-----------------------------------------

Status: COMPLETE (25 August 2026)

Every new or materially modified integration file should have:

1. A concise file-purpose comment.
2. JSDoc for exported functions, types, and non-obvious parameters.
3. Comments explaining security decisions.
4. Comments explaining backend-to-frontend mappings.
5. Comments explaining unusual loading, polling, or error behavior.

Also create:

- docs/FRONTEND_ARCHITECTURE.md
- docs/API_MAPPING.md
- docs/AUTHENTICATION_FLOW.md

Comments should explain why a decision exists. Avoid comments that only repeat
obvious JSX or TypeScript because that makes professional code harder to read.


STANDARD ERROR AND LOADING BEHAVIOR
-----------------------------------

Validation failure:
- Show inline field errors.
- Preserve the user's input.

401 Unauthorized:
- Delete the invalid session cookie.
- Redirect to login.
- Explain session expiry where appropriate.

403 Forbidden:
- Show a permission-denied state.
- Do not expose protected data.

404 Not Found:
- Render route-level not-found UI.

409 Conflict:
- Show the backend message in context.
- Refresh stale request or inventory data.

Network failure or timeout:
- Preserve existing content when possible.
- Show a retry action.
- Never pretend a mutation succeeded.

Unexpected exception:
- Use the nearest error.tsx boundary with a safe fallback and retry action.

Empty data:
- Render a designed empty state rather than a blank table or page.

Pending mutation:
- Disable the relevant action.
- Show visible progress.
- Prevent duplicate requests.

Background polling:
- Preserve current data while refreshing.
- Do not replace the entire screen with a spinner.
- Stop polling when a request reaches a terminal state.


BACKEND-TO-FRONTEND FIELD MAPPING
---------------------------------

Backend unitsRequired       -> Frontend units
Backend unitsAvailable      -> Frontend availableUnits
Backend unitsReserved       -> Frontend reservedUnits
Backend requester.id        -> Frontend hospitalId
Backend requester.name      -> Frontend hospitalName
Backend provider.id         -> Frontend providerId
Backend provider.name       -> Frontend providerName
Backend requestedAt         -> Timeline request-created event
Backend acceptedAt          -> Timeline accepted event
Backend preparingAt         -> Timeline preparing event
Backend dispatchedAt        -> Timeline in-transit event
Backend deliveredAt         -> Timeline delivered event
Backend cancelledAt         -> Timeline cancelled event

Candidate fields such as location, fulfilmentMinutes, and map coordinates must
become optional unless the backend contract is expanded.


DEFERRED ONBOARDING PLAN
------------------------

For a real healthcare platform, onboarding should not be public registration that
immediately activates hospitals or blood banks.

Recommended workflow:

Organization submits application
    -> platform verifies the organization
    -> admin approves or rejects it
    -> first organization administrator receives an invitation
    -> administrator activates the account and sets a password
    -> organization users can be invited

Possible endpoints:

POST /onboarding/applications
GET  /onboarding/applications/{applicationId}/status
GET  /admin/onboarding/applications
POST /admin/onboarding/applications/{applicationId}/approve
POST /admin/onboarding/applications/{applicationId}/reject
POST /invitations/{token}/accept

This requires decisions for:

- Organization verification status
- Approval and rejection reasons
- Invitation token lifetime
- Email verification
- Initial password setup
- Adding organization members
- Password recovery
- Audit history

Onboarding should follow the integrated and hardened hospital/bank workflows.


RECOMMENDED EXECUTION ORDER
---------------------------

1. Phase 0 and Phase 1.
2. Verify authentication and the API foundation.
3. Phase 2 and Phase 3.
4. Verify the complete hospital flow.
5. Phase 4 and Phase 5.
6. Verify provider and inventory flow.
7. Phase 6.
8. Phase 7 and Phase 8.
9. Implement admin APIs and onboarding after the core integration is stable.


PHASE 9 - ONBOARDING AND REMAINING API DECISIONS
-------------------------------------------------

Do not begin by adding public self-registration. First define the verified
organization application, approval, invitation, activation, password recovery,
member management, and audit contracts described above. Decide which admin and
network prototype screens will receive real endpoints and which will be removed
from the first release.

Exit criteria:

- An approved onboarding domain and endpoint contract exists.
- Security decisions for invitations, verification, and recovery are documented.
- Admin/network screens have a real API plan or are excluded from release.
- Phase 10 environment names and release smoke tests are agreed.


PHASE 10 - RENDER, VERCEL, AND NEON DEPLOYMENT
----------------------------------------------

1. Create a Neon production database and configure its JDBC/TLS credentials.
2. Deploy the Java 21 backend Dockerfile to Render.
3. Configure Render readiness at `/actuator/health/readiness`.
4. Set a newly generated production JWT secret and exact Vercel CORS origin.
5. Deploy Next.js to Vercel with server-only `HEMOGRID_API_URL`.
6. Run login, session restoration, hospital request, provider fulfilment,
   inventory, logout, error-state, and mobile/accessibility smoke tests.
7. Confirm Flyway history, logs, health, secure cookies, and secret rotation.

Exit criteria:

- The deployed hospital-to-provider flow succeeds against Neon.
- No local, demo-only, or previously shared secret is used in production.
- Monitoring and rollback instructions are recorded before user testing.
