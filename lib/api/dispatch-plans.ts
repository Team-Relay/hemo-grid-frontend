/**
 * Typed PLATFORM_ADMIN dispatch-planning reads, previews, and handoff helpers.
 */

import type {
  BackendBloodRequest,
  BackendDispatchPlanResponse,
  CreateDispatchPlanRequest,
} from "@/lib/api/backend-types";
import { apiRequest } from "@/lib/api/client";
import { ApiClientError } from "@/lib/api/errors";

export function listDispatchPlanRequests(accessToken: string): Promise<BackendBloodRequest[]> {
  return apiRequest<BackendBloodRequest[]>("/dispatch-plans/requests", { accessToken });
}

export function previewDispatchPlan(
  accessToken: string,
  input: CreateDispatchPlanRequest,
): Promise<BackendDispatchPlanResponse> {
  return apiRequest<BackendDispatchPlanResponse>("/dispatch-plans/preview", {
    method: "POST",
    accessToken,
    body: JSON.stringify(input),
  });
}

export function isDispatchPlanConflictError(error: unknown): boolean {
  if (!(error instanceof ApiClientError)) {
    return false;
  }

  return (
    error.status === 409 ||
    error.code === "COLD_CHAIN_HOLD" ||
    error.code === "INVALID_REQUEST_STATUS" ||
    error.code === "INSUFFICIENT_INVENTORY"
  );
}
