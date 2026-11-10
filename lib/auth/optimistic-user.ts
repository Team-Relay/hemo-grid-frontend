/**
 * Builds a presentation-only identity from an unverified backend JWT.
 *
 * This module exists so Next.js can choose the correct workspace and render a
 * generic application shell while Spring Boot is temporarily unreachable. The
 * decoded claims must never authorize data access or mutations; the backend
 * remains authoritative for every protected operation.
 */

import { Buffer } from "node:buffer";

import { z } from "zod";

import type { BackendUser } from "@/lib/api/backend-types";

const userRoleSchema = z.enum([
  "PLATFORM_ADMIN",
  "HOSPITAL_ADMIN",
  "HOSPITAL_STAFF",
  "BLOOD_BANK_ADMIN",
  "BLOOD_BANK_STAFF",
]);

const organizationTypeSchema = z.enum(["HOSPITAL", "BLOOD_BANK"]);

const optimisticClaimsSchema = z.object({
  sub: z.string().min(1),
  role: userRoleSchema,
  exp: z.number().int().positive(),
  organizationId: z.string().min(1).optional(),
  organizationType: organizationTypeSchema.optional(),
});

/**
 * Returns only enough identity to render navigation during an API outage.
 * Signature validation intentionally remains Spring Boot's responsibility.
 */
export function optimisticUserFromAccessToken(
  accessToken: string,
  nowMs = Date.now(),
): BackendUser | null {
  try {
    const parts = accessToken.split(".");
    if (parts.length !== 3 || !parts[1]) return null;

    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8")) as unknown;
    const parsed = optimisticClaimsSchema.safeParse(payload);
    if (!parsed.success || parsed.data.exp * 1_000 <= nowMs) return null;

    const { sub, role, organizationId, organizationType } = parsed.data;
    const organization =
      organizationId && organizationType
        ? {
            id: organizationId,
            name: organizationType === "HOSPITAL" ? "Hospital workspace" : "Blood-bank workspace",
            type: organizationType,
          }
        : null;

    return {
      id: sub,
      fullName: "Signed-in user",
      email: "Profile unavailable while the service is offline",
      role,
      organization,
    };
  } catch {
    return null;
  }
}
