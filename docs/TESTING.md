# Testing strategy

## Fast frontend checks

`npm test` runs Vitest tests for DTO mapping, stable API-error normalization,
hospital/provider validation, inventory validation, and role-to-workspace
routing. These tests are deterministic and do not require Spring Boot.

## Browser coverage

`npm run test:e2e` uses Playwright Chromium. The session test proves that a
hospital can log in, close its tab, revisit `/`, return to its dashboard, visit
`/login` without losing the active session, explicitly sign out, and then remain
signed out. It also runs an automated accessibility scan on the restored view.

Use `http://localhost:3000`, not `127.0.0.1`, with the Next development server;
matching the configured hostname avoids dev asset-origin checks that prevent
hydration.

## Backend coverage

Spring integration tests run against PostgreSQL. They cover the HTTP auth/error
contract, hospital and provider organization isolation, inventory constraints,
request matching and transitions, and concurrent acceptance. The concurrency
test starts two transactions against one request and asserts inventory is
reserved exactly once.

Never run integration tests against development or production data. Supply a
dedicated database through `DB_URL`, `DB_USERNAME`, and `DB_PASSWORD`.

Phase 8 verification result: all 20 backend integration tests, 14 frontend unit
tests, and the Chromium session/accessibility scenario passed. The isolated
Next.js production build also completed successfully.
