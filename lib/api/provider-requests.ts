/** Typed server-only client for blood-bank request reads and lifecycle mutations. */

import "server-only";

import type { BackendBloodRequest } from "@/lib/api/backend-types";
import { apiRequest } from "@/lib/api/client";
import type { BloodRequestStatus } from "@/types/domain";

export function listProviderRequests(accessToken: string): Promise<BackendBloodRequest[]> {
  return apiRequest<BackendBloodRequest[]>("/provider/requests", { accessToken });
}

export function getProviderRequest(
  accessToken: string,
  requestId: string,
): Promise<BackendBloodRequest> {
  return apiRequest<BackendBloodRequest>(`/provider/requests/${requestId}`, { accessToken });
}

export function acceptProviderRequest(
  accessToken: string,
  requestId: string,
): Promise<BackendBloodRequest> {
  return providerMutation(accessToken, requestId, "accept");
}

export function declineProviderRequest(
  accessToken: string,
  requestId: string,
): Promise<BackendBloodRequest> {
  return providerMutation(accessToken, requestId, "decline");
}

export function updateProviderRequestStatus(
  accessToken: string,
  requestId: string,
  status: Extract<BloodRequestStatus, "PREPARING" | "IN_TRANSIT" | "DELIVERED">,
): Promise<BackendBloodRequest> {
  return apiRequest<BackendBloodRequest>(`/provider/requests/${requestId}/status`, {
    method: "POST",
    accessToken,
    body: JSON.stringify({ status }),
  });
}

function providerMutation(
  accessToken: string,
  requestId: string,
  action: "accept" | "decline",
): Promise<BackendBloodRequest> {
  return apiRequest<BackendBloodRequest>(`/provider/requests/${requestId}/${action}`, {
    method: "POST",
    accessToken,
  });
}
