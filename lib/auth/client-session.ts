/** Browser-accessible session token helpers shared with Next.js SSR cookie storage. */

export const ACCESS_TOKEN_COOKIE = "hemogrid_access_token";
export const DEFAULT_SESSION_SECONDS = 60 * 60 * 12;

function resolveCookieMaxAge(expiresInSeconds?: number, remember = true): number {
  const backendSeconds =
    expiresInSeconds && Number.isFinite(expiresInSeconds) && expiresInSeconds > 0
      ? Math.floor(expiresInSeconds)
      : DEFAULT_SESSION_SECONDS;

  if (!remember) {
    return Math.min(backendSeconds, DEFAULT_SESSION_SECONDS);
  }

  return backendSeconds;
}

/** Reads the active bearer token from browser cookies for direct-to-Spring-Boot requests. */
export function getClientAccessToken(): string | null {
  if (typeof document === "undefined") {
    return null;
  }

  const prefix = `${ACCESS_TOKEN_COOKIE}=`;
  const parts = document.cookie.split(";");
  for (const rawPart of parts) {
    const part = rawPart.trim();
    if (part.startsWith(prefix)) {
      const value = decodeURIComponent(part.slice(prefix.length)).trim();
      return value.length > 0 ? value : null;
    }
  }

  return null;
}

/** Persists the JWT bearer token in the browser cookie store so both SSR and client fetches share it. */
export function setClientSessionCookie(
  accessToken: string,
  expiresInSeconds?: number,
  remember = true,
): void {
  if (typeof document === "undefined") {
    return;
  }

  const maxAge = resolveCookieMaxAge(expiresInSeconds, remember);
  const secureFlag =
    typeof window !== "undefined" && window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${ACCESS_TOKEN_COOKIE}=${encodeURIComponent(accessToken)}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secureFlag}`;
}

/** Clears the JWT bearer token cookie in the browser. */
export function clearClientSessionCookie(): void {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = `${ACCESS_TOKEN_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
}
