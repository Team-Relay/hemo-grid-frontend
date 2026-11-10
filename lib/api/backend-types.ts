/**
 * Exact TypeScript representations of the DTOs currently returned by the
 * Spring Boot API. UI components should consume mapped view models instead of
 * importing these transport types directly.
 */

import type {
  BloodComponent,
  BloodGroup,
  BloodRequestStatus,
  OrganizationType,
  RequestUrgency,
} from "@/types/domain";

export type UserRole =
  "PLATFORM_ADMIN" | "HOSPITAL_ADMIN" | "HOSPITAL_STAFF" | "BLOOD_BANK_ADMIN" | "BLOOD_BANK_STAFF";

export type ApiErrorCode =
  | "VALIDATION_FAILED"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "RESOURCE_NOT_FOUND"
  | "INVALID_REQUEST_STATUS"
  | "INVALID_STATUS_TRANSITION"
  | "INSUFFICIENT_INVENTORY"
  | "PROVIDER_NOT_SELECTED"
  | "ORGANIZATION_INACTIVE"
  | "ORGANIZATION_TYPE_MISMATCH"
  | "REQUEST_ALREADY_FINALIZED"
  | "INTERNAL_ERROR";

export interface BackendFieldError {
  field: string;
  message: string;
}

export interface BackendApiError {
  timestamp?: string;
  status: number;
  error: string;
  code?: ApiErrorCode;
  message: string;
  path?: string;
  fieldErrors?: BackendFieldError[];
}

export interface BackendOrganizationSummary {
  id: string;
  name: string;
  type: OrganizationType;
}

export interface BackendUser {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  organization: BackendOrganizationSummary | null;
}

export interface BackendLoginResponse {
  accessToken: string;
  tokenType: "Bearer";
  expiresIn: number;
  user: BackendUser;
}

export interface BackendOrganization {
  id: string;
  name: string;
  type: OrganizationType;
  email: string | null;
  phone: string | null;
  address: string;
  city: string | null;
  state: string | null;
  active: boolean;
}

export interface BackendBloodRequest {
  id: string;
  requester: BackendOrganizationSummary;
  provider: BackendOrganizationSummary | null;
  bloodGroup: BloodGroup;
  component: BloodComponent;
  unitsRequired: number;
  urgency: RequestUrgency;
  status: BloodRequestStatus;
  clinicalReference: string | null;
  notes: string | null;
  requestedAt: string;
  acceptedAt: string | null;
  preparingAt: string | null;
  dispatchedAt: string | null;
  deliveredAt: string | null;
  cancelledAt: string | null;
  updatedAt: string;
}

export interface BackendCandidate {
  organizationId: string;
  organizationName: string;
  bloodGroup: BloodGroup;
  component: BloodComponent;
  unitsFree: number;
  distanceKm: number | null;
  canFullyFulfil: boolean;
  rank: number;
}

export interface BackendCandidateList {
  requestId: string;
  candidates: BackendCandidate[];
}

export interface BackendInventoryItem {
  id: string;
  bloodGroup: BloodGroup;
  component: BloodComponent;
  unitsAvailable: number;
  unitsReserved: number;
  unitsFree: number;
}
