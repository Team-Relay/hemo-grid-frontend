/**
 * Server-only hospital read model.
 *
 * Pages call this layer instead of coordinating authentication, transport,
 * and view-model mapping themselves.
 */

import "server-only";

import {
  getBloodRequest,
  getBloodRequestCandidates,
  listBloodRequests,
} from "@/lib/api/blood-requests";
import type { BackendOrganization } from "@/lib/api/backend-types";
import { mapBloodRequest, mapBloodRequests, mapCandidates } from "@/lib/api/mappers";
import { getCurrentOrganization } from "@/lib/api/organizations";
import { verifySession } from "@/lib/auth/dal";
import type { BloodRequest, Candidate } from "@/types/domain";

export interface HospitalDashboardData {
  organization: BackendOrganization;
  requests: BloodRequest[];
}

export interface HospitalRequestMatches {
  request: BloodRequest;
  candidates: Candidate[];
}

export async function getHospitalDashboardData(): Promise<HospitalDashboardData> {
  const { accessToken } = await verifySession();
  const [organization, requestDtos] = await Promise.all([
    getCurrentOrganization(accessToken),
    listBloodRequests(accessToken),
  ]);

  return {
    organization,
    requests: mapBloodRequests(requestDtos),
  };
}

export async function getHospitalRequests(): Promise<BloodRequest[]> {
  const { accessToken } = await verifySession();
  return mapBloodRequests(await listBloodRequests(accessToken));
}

export async function getHospitalRequest(requestId: string): Promise<BloodRequest> {
  const { accessToken } = await verifySession();
  return mapBloodRequest(await getBloodRequest(accessToken, requestId));
}

export async function getHospitalRequestMatches(
  requestId: string,
): Promise<HospitalRequestMatches> {
  const { accessToken } = await verifySession();
  const [requestDto, candidateList] = await Promise.all([
    getBloodRequest(accessToken, requestId),
    getBloodRequestCandidates(accessToken, requestId),
  ]);

  return {
    request: mapBloodRequest(requestDto),
    candidates: mapCandidates(candidateList.candidates),
  };
}
