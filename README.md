# HemoGrid Frontend

HemoGrid is a clinical blood requisition, cold-chain verification, and regional smart dispatch platform connecting hospitals, regional blood transfusion centres, and network administrators.

## Getting Started

Configure your environment variables by copying `environment.example` to `.env.local`:

```bash
cp environment.example .env.local
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables

| Variable | Description |
| :--- | :--- |
| `NEXT_PUBLIC_HEMOGRID_API_URL` | Base URL of the HemoGrid Spring Boot API (e.g., `http://localhost:8080/api/v1` locally or your Render backend URL in production). |
| `HEMOGRID_API_URL` | Optional server-side override for the Spring Boot API URL. |

## Quality Gates & Production Build

```bash
npm run lint
npx tsc --noEmit
npm test
npm run build
```

## Documentation

Architecture and operational references are organized under [`docs/`](./docs):

- [`docs/FRONTEND_ARCHITECTURE.md`](./docs/FRONTEND_ARCHITECTURE.md) — Application architecture and responsibility boundaries
- [`docs/AUTHENTICATION_FLOW.md`](./docs/AUTHENTICATION_FLOW.md) — Session cookie and JWT verification flow
- [`docs/HOSPITAL_REQUEST_FLOW.md`](./docs/HOSPITAL_REQUEST_FLOW.md) — Hospital emergency requisition and smart matching workflow
- [`docs/PROVIDER_AND_INVENTORY_FLOW.md`](./docs/PROVIDER_AND_INVENTORY_FLOW.md) — Blood bank fulfilment and cold-chain inventory workflow
- [`docs/API_MAPPING.md`](./docs/API_MAPPING.md) — Frontend-to-Spring-Boot API contract mapping
- [`docs/DEPLOYMENT_PREPARATION.md`](./docs/DEPLOYMENT_PREPARATION.md) — Cloud deployment configuration (Vercel & Render)
- [`docs/TESTING.md`](./docs/TESTING.md) — Unit and end-to-end verification guide
- [`docs/CODE_REVIEW_GUIDE.md`](./docs/CODE_REVIEW_GUIDE.md) — Codebase walkthrough guide
