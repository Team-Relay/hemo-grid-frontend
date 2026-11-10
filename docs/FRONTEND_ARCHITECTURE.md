# HemoGrid frontend architecture

## Request flow

The browser renders the Next.js application. Server Components and Server
Actions call Spring Boot through the server-only API client. The backend JWT is
stored in an HttpOnly cookie and never exposed to browser JavaScript.

```text
Browser -> Next.js server -> Spring Boot API -> PostgreSQL
```

## Responsibility boundaries

- `lib/api/client.ts` owns HTTP, bearer attachment, timeouts, and parsing.
- `lib/api/backend-types.ts` mirrors backend transport DTOs.
- `lib/api/mappers.ts` translates transport DTOs into UI view models.
- `lib/data/hospital.ts` composes authenticated hospital reads for route pages.
- `app/actions/blood-requests.ts` owns validated hospital request mutations and
  cache revalidation.
- `lib/auth/session.ts` owns the HttpOnly access-token cookie.
- `lib/auth/dal.ts` validates sessions and roles close to data access.
- `proxy.ts` performs cookie-presence redirects only.
- Spring Boot remains the final authorization and business-rule authority.

Server Components are preferred for initial reads. Server Actions are preferred
for user-triggered mutations. Client Components remain responsible for local UI
state, dialogs, filters, and visible pending feedback.

Active request detail pages use a small client poller that calls
`router.refresh()` every five seconds only while the browser tab is visible.
The refreshed data still comes through authenticated Server Components, and the
poller stops for terminal request statuses.
