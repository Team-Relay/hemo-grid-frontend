/** Verifies direct browser-to-Spring-Boot API URL resolution, bearer transport, and client session cookies. */

import { afterEach, describe, expect, it, vi } from "vitest";

import { apiRequest, getApiBaseUrl } from "@/lib/api/client";
import {
  ACCESS_TOKEN_COOKIE,
  clearClientSessionCookie,
  getClientAccessToken,
  setClientSessionCookie,
} from "@/lib/auth/client-session";

describe("getApiBaseUrl and apiRequest", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("defaults to http://localhost:8080/api/v1 when no env var is set in non-production", () => {
    vi.stubEnv("NEXT_PUBLIC_HEMOGRID_API_URL", "");
    vi.stubEnv("HEMOGRID_API_URL", "");
    vi.stubEnv("NODE_ENV", "development");

    expect(getApiBaseUrl()).toBe("http://localhost:8080/api/v1");
  });

  it("prioritizes NEXT_PUBLIC_HEMOGRID_API_URL (e.g. Render deployment URL) and trims trailing slashes", () => {
    vi.stubEnv("NEXT_PUBLIC_HEMOGRID_API_URL", "https://hemogrid-backend.onrender.com/api/v1///");
    vi.stubEnv("HEMOGRID_API_URL", "http://localhost:8080/api/v1");

    expect(getApiBaseUrl()).toBe("https://hemogrid-backend.onrender.com/api/v1");
  });

  it("sends requests directly to the Spring Boot base URL with Bearer token and JSON body", async () => {
    vi.stubEnv("NEXT_PUBLIC_HEMOGRID_API_URL", "http://localhost:8080/api/v1");

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ id: "req-1", status: "MATCHING" }), {
        status: 201,
        headers: { "content-type": "application/json" },
      }),
    );

    const payload = await apiRequest<{ id: string; status: string }>("/blood-requests", {
      method: "POST",
      accessToken: "jwt-token-123",
      body: JSON.stringify({
        bloodGroup: "O_NEGATIVE",
        component: "RED_CELLS",
        unitsRequired: 3,
        urgency: "CRITICAL",
      }),
    });

    expect(payload).toEqual({ id: "req-1", status: "MATCHING" });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [calledUrl, calledInit] = fetchSpy.mock.calls[0]!;
    expect(calledUrl).toBe("http://localhost:8080/api/v1/blood-requests");
    expect(calledInit?.method).toBe("POST");
    expect(calledInit?.cache).toBe("no-store");

    const headers = new Headers(calledInit?.headers);
    expect(headers.get("Authorization")).toBe("Bearer jwt-token-123");
    expect(headers.get("Content-Type")).toBe("application/json");
  });
});

describe("client-session cookie helpers", () => {
  afterEach(() => {
    clearClientSessionCookie();
  });

  it("writes, reads, and clears the shared hemogrid_access_token cookie", () => {
    expect(getClientAccessToken()).toBeNull();

    setClientSessionCookie("token-abc-xyz", 3600, true);
    expect(document.cookie).toContain(`${ACCESS_TOKEN_COOKIE}=token-abc-xyz`);
    expect(getClientAccessToken()).toBe("token-abc-xyz");

    clearClientSessionCookie();
    expect(getClientAccessToken()).toBeNull();
  });
});
