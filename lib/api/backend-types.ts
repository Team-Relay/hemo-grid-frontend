/**
 * Exact TypeScript representations of the DTOs returned by the Spring Boot API
 * (including optional HemoGrid v2 Smart Dispatch and Cold-Chain fields).
 */

import type {
  BloodComponent,
  BloodGroup,
  BloodRequestStatus,
  ColdChainStatus,
  FacilityTier,
  MatchCompatibilityType,
  OrganizationType,
  RequestUrgency,
} from "@/types/domain";

export type UserRole =
  | "PLATFORM_ADMIN"
  | "HOSPITAL_ADMIN"
  | "HOSPITAL_STAFF"
  | "BLOOD_BANK_ADMIN"
  | "BLOOD_BANK_STAFF";

export type ApiErrorCode =
  | "VALIDATION_FAILED"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "RESOURCE_NOT_FOUND"
  | "INVALID_REQUEST_STATUS"
  | "INVALID_STATUS_TRANSITION"
  | "INSUFFICIENT_INVENTORY"
  | "COLD_CHAIN_HOLD"
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
  unknownPatientBloodGroup?: boolean;
  estimatedTransitHours?: number | null;
  matchType?: MatchCompatibilityType;
  coldChainVerified?: boolean;
}

export interface BackendCandidate {
  organizationId: string;
  organizationName: string;
  facilityCode?: string;
  facilityTier?: FacilityTier;
  bloodGroup: BloodGroup;
  offeredBloodGroup?: BloodGroup;
  component: BloodComponent;
  unitsFree: number;
  distanceKm: number | null;
  estimatedTransitHours?: number | null;
  canFullyFulfil: boolean;
  rank: number;
  matchType?: MatchCompatibilityType;
  coldChainVerified?: boolean;
  fridgeTempCelsius?: number;
  quarantinedUnitsExcluded?: number;
  conservationRuleApplied?: boolean;
  recommendationReasons?: string[];
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
  updatedAt: string;
  quarantinedTempExcursionUnits?: number;
  fridgeTempCelsius?: number;
  coldChainStatus?: ColdChainStatus;
  expiringWithin7DaysUnits?: number;
}

export type DispatchPlanStatus = "OPTIMAL" | "FEASIBLE" | "INFEASIBLE" | "LIMIT_REACHED";

export interface BackendDispatchBaselineAssignment {
  orderId: string;
  stockId: string;
  transitHours: number;
}

export interface BackendDispatchBaseline {
  status: DispatchPlanStatus;
  assignments: BackendDispatchBaselineAssignment[];
  totalTransitHours: number | null;
  visitedNodes: number;
}

export interface BackendDispatchProposal {
  requestId: string;
  requesterOrganizationId: string;
  providerOrganizationId: string;
  providerName: string;
  offeredBloodGroup: BloodGroup;
  inventoryId: string;
  inventoryVersion: number;
  unitsRequired: number;
  dispatchableUnitsAtPlanning: number;
  unitsRemainingAfterWholePlan: number;
  estimatedTransitHours: number;
  recordedFridgeTempCelsius: number;
  inventoryUpdatedAt: string;
  rationale: string;
}

export interface BackendDispatchPlanResponse {
  generatedAt: string;
  status: DispatchPlanStatus;
  totalEstimatedTransitHours: number | null;
  visitedNodes: number;
  nearestEligibleBaseline: BackendDispatchBaseline;
  proposals: BackendDispatchProposal[];
  notes: string[];
}

export interface CreateDispatchPlanRequest {
  requestIds: string[];
  staffApproved: true;
}
