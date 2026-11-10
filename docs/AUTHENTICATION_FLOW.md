# Authentication flow

1. The login form submits credentials to the `loginAction` Server Action.
2. The action validates input before calling Spring Boot `POST /auth/login`.
3. Spring Boot verifies the user and returns its signed access token.
4. Next.js stores the token in an HttpOnly, SameSite=Lax cookie.
5. The action redirects according to the backend user role.
6. Protected server data calls use `verifySession()`.
7. `verifySession()` forwards the token to Spring Boot `GET /auth/me`.
8. Logout deletes the cookie and redirects to `/login`.

Proxy only checks that the cookie exists. It does not replace backend JWT
validation or authorization.

## Session restoration

The public `/` and `/login` pages call `getOptionalSession()`. If the cookie is
present and Spring Boot confirms it through `GET /auth/me`, the user is sent to
the dashboard mapped to their role. Closing a browser tab therefore does not log
the user out. A session ends only when the user explicitly signs out, the cookie
expires, or Spring rejects the JWT.

An invalid cookie is treated as signed out on public entry pages. Protected
pages redirect an invalid session to `/login?reason=session-expired`. Server
Components cannot delete cookies while rendering, so the stale value is safely
overwritten by the next successful login or removed by logout.

The cookie uses `HttpOnly` and `SameSite=Lax`; `Secure` is enabled automatically
in production. Selecting “Keep me signed in” supplies an explicit cookie
`maxAge`. Without it, the browser owns the session-cookie lifetime.
