/**
 * Typed organization reads from the Spring Boot API.
 */

import "server-only";

import type { BackendOrganization } from "@/lib/api/backend-types";
import { apiRequest } from "@/lib/api/client";

export function getCurrentOrganization(accessToken: string): Promise<BackendOrganization> {
  return apiRequest<BackendOrganization>("/organizations/me", { accessToken });
}
