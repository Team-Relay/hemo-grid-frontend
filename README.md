# HemoGrid Frontend

HemoGrid is a Next.js 16 coordination console for hospitals, blood-bank
providers, and future platform administrators. Server Components perform
authenticated reads, Server Actions perform mutations, and the Spring Boot JWT
stays in an HttpOnly cookie rather than browser storage.

## Run locally

Start PostgreSQL and Spring Boot first, then create `.env.local` from
`environment.example` and run:

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. Demo credentials are prefilled by workspace on the
login screen and are verified by the backend.

## Quality gates

```bash
npm run lint
npx tsc --noEmit --incremental false
npm test
npm run build
```

With both applications running, install Chromium once and run browser tests:

```bash
npx playwright install chromium
npm run test:e2e
```

## Review map

- `phase.txt` is the phase-by-phase delivery record and remaining roadmap.
- `docs/FRONTEND_ARCHITECTURE.md` explains responsibility boundaries.
- `docs/AUTHENTICATION_FLOW.md` explains cookie and session restoration.
- `docs/HOSPITAL_REQUEST_FLOW.md` follows the hospital workflow.
- `docs/PROVIDER_AND_INVENTORY_FLOW.md` follows provider fulfilment and stock.
- `docs/TESTING.md` describes automated coverage and isolated test data.
- `docs/CODE_REVIEW_GUIDE.md` gives a recommended meticulous review order.
- `docs/DEPLOYMENT_PREPARATION.md` records the Phase 10 Vercel/Render/Neon contract.

Administrative pages and the regional network map remain clearly disclosed
prototypes until matching platform-wide backend endpoints are implemented.
