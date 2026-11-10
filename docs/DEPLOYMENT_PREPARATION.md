# Phase 10 deployment preparation

No deployment is performed in Phase 8. The intended topology is:

```text
Browser -> Vercel Next.js -> Render Spring Boot -> Neon PostgreSQL
```

## Vercel frontend

Set `HEMOGRID_API_URL` to the public Render URL including `/api/v1`. It must stay
server-only and must not use a `NEXT_PUBLIC_` prefix. Confirm production cookies
are `Secure`, then run the browser session and hospital/provider smoke flows on
the deployed origin.

## Render backend

Build from the backend `Dockerfile`. Set `JWT_SECRET` to a new production secret
of at least 32 bytes, `CORS_ALLOWED_ORIGINS` to the exact Vercel HTTPS origin,
and use `/actuator/health/readiness` for readiness checks. Render supplies
`PORT`; Spring reads it automatically.

## Neon PostgreSQL

Use a dedicated production project/branch. `DB_URL` must be a JDBC URL such as
`jdbc:postgresql://...?...&sslmode=require`, while `DB_USERNAME` and
`DB_PASSWORD` remain separate secrets. Flyway applies the versioned migrations
at startup. Never run test reset SQL against Neon production.

Before Phase 10, rotate every secret that has appeared in local files or chat,
decide whether Swagger stays public, and complete the Phase 9 onboarding/API-gap
decision so prototype admin pages are not mistaken for released features.
