/**
 * Server-only Data Access Layer for authenticated user and role checks.
 *
 * Proxy performs a fast cookie-presence redirect, while this DAL asks Spring
 * Boot to validate the JWT before protected data is used.
 */

import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import type { BackendUser, UserRole } from "@/lib/api/backend-types";
import { ApiClientError } from "@/lib/api/errors";
import { getCurrentUser } from "@/lib/api/auth";
import { optimisticUserFromAccessToken } from "@/lib/auth/optimistic-user";
import { getAccessToken } from "@/lib/auth/session";
import { workspacePathForRole } from "@/lib/auth/roles";

export interface VerifiedSession {
  accessToken: string;
  user: BackendUser;
}

export interface ShellSession extends VerifiedSession {
  /** True only when identity came from JWT claims because the API was unavailable. */
  serviceUnavailable: boolean;
}

type SessionResolution =
  | { kind: "missing" }
  | { kind: "invalid" }
  | { kind: "verified"; session: VerifiedSession }
  | {
      kind: "unavailable";
      accessToken: string;
      error: ApiClientError;
      optimisticUser: BackendUser | null;
    };

/**
 * Performs at most one `/auth/me` request per server render. Consumers can
 * then choose strict verification for data or optimistic identity for chrome.
 */
const resolveSession = cache(async (): Promise<SessionResolution> => {
  const accessToken = await getAccessToken();
  if (!accessToken) return { kind: "missing" };

  try {
    const user = await getCurrentUser(accessToken);
    return { kind: "verified", session: { accessToken, user } };
  } catch (error) {
    if (error instanceof ApiClientError && error.status === 401) {
      return { kind: "invalid" };
    }

    if (isServiceUnavailable(error)) {
      return {
        kind: "unavailable",
        accessToken,
        error,
        optimisticUser: optimisticUserFromAccessToken(accessToken),
      };
    }

    throw error;
  }
});

/**
 * Resolves identity for public entry pages without forcing a redirect. During
 * an outage, current JWT claims may restore workspace navigation, but only
 * strict `verifySession` callers are allowed to request protected data.
 */
export async function getOptionalSession(): Promise<ShellSession | null> {
  const resolution = await resolveSession();

  if (resolution.kind === "verified") {
    return { ...resolution.session, serviceUnavailable: false };
  }

  if (resolution.kind === "unavailable" && resolution.optimisticUser) {
    return {
      accessToken: resolution.accessToken,
      user: resolution.optimisticUser,
      serviceUnavailable: true,
    };
  }

  return null;
}

export const verifySession = cache(async (): Promise<VerifiedSession> => {
  const resolution = await resolveSession();

  if (resolution.kind === "missing") {
    redirect("/login");
  }

  if (resolution.kind === "invalid") {
    redirect("/login?reason=session-expired");
  }

  if (resolution.kind === "unavailable") throw resolution.error;

  return resolution.session;
});

/**
 * Protects workspace chrome. Verified identity is preferred; current JWT
 * claims are an outage-only presentation fallback and never authorize API use.
 */
export async function requireShellRole(allowedRoles: readonly UserRole[]): Promise<ShellSession> {
  const resolution = await resolveSession();

  if (resolution.kind === "missing") redirect("/login");
  if (resolution.kind === "invalid") redirect("/login?reason=session-expired");

  if (resolution.kind === "unavailable") {
    if (!resolution.optimisticUser) {
      redirect("/login?reason=service-unavailable");
    }

    if (!allowedRoles.includes(resolution.optimisticUser.role)) {
      redirect(workspacePathForRole(resolution.optimisticUser.role));
    }

    return {
      accessToken: resolution.accessToken,
      user: resolution.optimisticUser,
      serviceUnavailable: true,
    };
  }

  const session = resolution.session;

  if (!allowedRoles.includes(session.user.role)) {
    redirect(workspacePathForRole(session.user.role));
  }

  return { ...session, serviceUnavailable: false };
}

function isServiceUnavailable(error: unknown): error is ApiClientError {
  return (
    error instanceof ApiClientError &&
    (error.status === 0 ||
      error.status >= 500 ||
      error.code === "NETWORK_ERROR" ||
      error.code === "NETWORK_TIMEOUT")
  );
}
