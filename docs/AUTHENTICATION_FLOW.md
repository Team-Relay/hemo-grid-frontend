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
