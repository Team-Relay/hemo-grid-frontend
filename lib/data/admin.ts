/**
 * Server-only PLATFORM_ADMIN data loaders.
 */

import "server-only";

import { redirect } from "next/navigation";
import type { BackendBloodRequest } from "@/lib/api/backend-types";
import { listDispatchPlanRequests } from "@/lib/api/dispatch-plans";
import { verifySession } from "@/lib/auth/dal";
import { ADMIN_ROLES, workspacePathForRole } from "@/lib/auth/roles";

export async function getAdminDispatchPlannerRequests(): Promise<BackendBloodRequest[]> {
  const { accessToken, user } = await verifySession();
  if (!ADMIN_ROLES.includes(user.role)) {
    redirect(workspacePathForRole(user.role));
  }

  return listDispatchPlanRequests(accessToken);
}
