/**
 * Central role-to-workspace rules. Keeping this mapping in one place prevents
 * authentication redirects from drifting across pages and actions.
 */

import type { UserRole } from "@/lib/api/backend-types";

export const HOSPITAL_ROLES: readonly UserRole[] = ["HOSPITAL_ADMIN", "HOSPITAL_STAFF"];

export const BLOOD_BANK_ROLES: readonly UserRole[] = ["BLOOD_BANK_ADMIN", "BLOOD_BANK_STAFF"];

export const ADMIN_ROLES: readonly UserRole[] = ["PLATFORM_ADMIN"];

export function workspacePathForRole(role: UserRole): string {
  if (HOSPITAL_ROLES.includes(role)) {
    return "/hospital/dashboard";
  }
  if (BLOOD_BANK_ROLES.includes(role)) {
    return "/blood-bank/dashboard";
  }
  return "/admin/dashboard";
}
