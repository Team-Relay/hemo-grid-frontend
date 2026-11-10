/**
 * Typed hospital blood-request reads from the Spring Boot API.
 */

import "server-only";

import type { BackendBloodRequest, BackendCandidateList } from "@/lib/api/backend-types";
import { apiRequest } from "@/lib/api/client";
import type { CreateBloodRequestInput } from "@/lib/validation/blood-request";

export function createBloodRequest(
  accessToken: string,
  request: CreateBloodRequestInput,
): Promise<BackendBloodRequest> {
  return apiRequest<BackendBloodRequest>("/blood-requests", {
    method: "POST",
    accessToken,
    body: JSON.stringify(request),
  });
}

export function listBloodRequests(accessToken: string): Promise<BackendBloodRequest[]> {
  return apiRequest<BackendBloodRequest[]>("/blood-requests", { accessToken });
}

export function getBloodRequest(
  accessToken: string,
  requestId: string,
): Promise<BackendBloodRequest> {
  return apiRequest<BackendBloodRequest>(`/blood-requests/${encodeURIComponent(requestId)}`, {
    accessToken,
  });
}

export function getBloodRequestCandidates(
  accessToken: string,
  requestId: string,
): Promise<BackendCandidateList> {
  return apiRequest<BackendCandidateList>(
    `/blood-requests/${encodeURIComponent(requestId)}/candidates`,
    { accessToken },
  );
}

export function selectBloodRequestProvider(
  accessToken: string,
  requestId: string,
  providerOrganizationId: string,
): Promise<BackendBloodRequest> {
  return apiRequest<BackendBloodRequest>(
    `/blood-requests/${encodeURIComponent(requestId)}/select-provider`,
    {
      method: "POST",
      accessToken,
      body: JSON.stringify({ providerOrganizationId }),
    },
  );
}

export function cancelBloodRequest(
  accessToken: string,
  requestId: string,
): Promise<BackendBloodRequest> {
  return apiRequest<BackendBloodRequest>(
    `/blood-requests/${encodeURIComponent(requestId)}/cancel`,
    { method: "POST", accessToken },
  );
}
