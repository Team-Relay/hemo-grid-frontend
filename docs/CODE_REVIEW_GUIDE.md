# Code review guide

Review the integration from boundaries inward:

1. Read `lib/api/backend-types.ts`, `docs/API_MAPPING.md`, and the backend API
   records to understand the transport contract.
2. Read `lib/api/client.ts`, `lib/api/errors.ts`, and `lib/auth/*` to verify the
   server-only JWT and stable error boundary.
3. Follow `docs/HOSPITAL_REQUEST_FLOW.md` through hospital reads and actions.
4. Follow `docs/PROVIDER_AND_INVENTORY_FLOW.md` through provider mutations,
   request locking, and inventory accounting.
5. Review route `loading.tsx`, `error.tsx`, and `not-found.tsx` files alongside
   each page rather than separately.
6. Read frontend unit/browser tests and backend integration tests last; each one
   states the invariant it protects.

Purpose comments sit at the top of application source and configuration files.
Additional comments explain security, mapping, concurrency, polling, or
non-obvious state. Obvious markup is intentionally not narrated because noisy
comments make real invariants harder to find.

JSON cannot legally contain comments. Therefore `package.json`, lock files,
TypeScript config, and Prettier config are explained here and through their
script/key names. `next-env.d.ts` and `tsconfig.tsbuildinfo` are generated and
must not be hand-edited. Images, icons, and SVG assets contain no executable
business logic.

Already-applied backend Flyway migrations are also intentionally untouched.
Flyway includes comments in migration checksums, so editing those files after
application would break startup validation; explain them in backend architecture
documentation and create a new versioned migration for future schema changes.
