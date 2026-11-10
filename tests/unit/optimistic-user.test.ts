/** Verifies that outage-only identity hints are narrow, defensive, and expiry-aware. */

import { Buffer } from "node:buffer";

import { describe, expect, it } from "vitest";

import { optimisticUserFromAccessToken } from "@/lib/auth/optimistic-user";

function tokenFor(payload: Record<string, unknown>): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const claims = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${header}.${claims}.presentation-only-signature`;
}

describe("optimisticUserFromAccessToken", () => {
  const now = Date.parse("2026-08-25T12:00:00Z");

  it("creates a generic hospital shell identity from current claims", () => {
    const user = optimisticUserFromAccessToken(
      tokenFor({
        sub: "user-id",
        role: "HOSPITAL_STAFF",
        organizationId: "hospital-id",
        organizationType: "HOSPITAL",
        exp: now / 1_000 + 300,
      }),
      now,
    );

    expect(user).toMatchObject({
      id: "user-id",
      role: "HOSPITAL_STAFF",
      organization: {
        id: "hospital-id",
        name: "Hospital workspace",
        type: "HOSPITAL",
      },
    });
  });

  it("rejects expired, malformed, and unknown-role tokens", () => {
    const expired = tokenFor({
      sub: "user-id",
      role: "HOSPITAL_STAFF",
      exp: now / 1_000 - 1,
    });
    const unknownRole = tokenFor({ sub: "user-id", role: "SUPER_USER", exp: now / 1_000 + 300 });

    expect(optimisticUserFromAccessToken(expired, now)).toBeNull();
    expect(optimisticUserFromAccessToken(unknownRole, now)).toBeNull();
    expect(optimisticUserFromAccessToken("not-a-jwt", now)).toBeNull();
  });
});
