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
import { getAccessToken } from "@/lib/auth/session";
import { workspacePathForRole } from "@/lib/auth/roles";

export interface VerifiedSession {
  accessToken: string;
  user: BackendUser;
}

/**
 * Resolves a valid session for public entry pages without forcing a redirect.
 * Invalid cookies are treated as signed-out; the next successful login safely
 * replaces them because Server Components cannot mutate response cookies.
 */
export const getOptionalSession = cache(async (): Promise<VerifiedSession | null> => {
  const accessToken = await getAccessToken();
  if (!accessToken) return null;

  try {
    const user = await getCurrentUser(accessToken);
    return { accessToken, user };
  } catch (error) {
    if (error instanceof ApiClientError && error.status === 401) return null;
    throw error;
  }
});

export const verifySession = cache(async (): Promise<VerifiedSession> => {
  const accessToken = await getAccessToken();

  if (!accessToken) {
    redirect("/login");
  }

  try {
    const user = await getCurrentUser(accessToken);
    return { accessToken, user };
  } catch (error) {
    if (error instanceof ApiClientError && error.status === 401) {
      redirect("/login?reason=session-expired");
    }
    throw error;
  }
});

/**
 * Requires one of the supplied roles and redirects a valid user back to their
 * own workspace if they attempt to enter another role's route.
 */
export async function requireRole(allowedRoles: readonly UserRole[]): Promise<VerifiedSession> {
  const session = await verifySession();

  if (!allowedRoles.includes(session.user.role)) {
    redirect(workspacePathForRole(session.user.role));
  }

  return session;
}
