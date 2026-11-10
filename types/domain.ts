/** UI-facing domain contracts kept independent from Spring Boot transport DTOs. */

export type BloodGroup =
  | "A_POSITIVE"
  | "A_NEGATIVE"
  | "B_POSITIVE"
  | "B_NEGATIVE"
  | "AB_POSITIVE"
  | "AB_NEGATIVE"
  | "O_POSITIVE"
  | "O_NEGATIVE";

export type BloodComponent = "WHOLE_BLOOD" | "RED_CELLS" | "PLATELETS" | "PLASMA";

export type RequestUrgency = "ROUTINE" | "URGENT" | "CRITICAL";

export type BloodRequestStatus =
  | "REQUESTED"
  | "ACCEPTED"
  | "PREPARING"
  | "IN_TRANSIT"
  | "DELIVERED"
  | "DECLINED"
  | "CANCELLED"
  | "EXPIRED";

export type OrganizationType = "HOSPITAL" | "BLOOD_BANK";
export type FacilityTier = "RBTC" | "SATELLITE" | "HOSPITAL";
export type FacilityStatus = "ONLINE" | "DEGRADED" | "OFFLINE";
export type StockHealth = "HEALTHY" | "MODERATE" | "LOW" | "CRITICAL";
export type MatchCompatibilityType = "EXACT" | "COMPATIBLE_SUBSTITUTE";
export type ColdChainStatus = "VERIFIED_2_6C" | "EXCURSION_QUARANTINED";

export interface Organization {
  id: string;
  facilityCode?: string;
  facilityTier?: FacilityTier;
  name: string;
  type: OrganizationType;
  location: string;
  county?: string;
  coordinates: { x: number; y: number };
  networkStatus: FacilityStatus;
  lastUpdated: string;
  activeRequests: number;
  totalStock?: number;
  quarantinedUnits?: number;
  fridgeTempCelsius?: number;
  assignedSupplyCentre?: string;
  recommendedSupplyCentre?: string;
  savedTransitHours?: number;
}

export interface InventoryItem {
  id: string;
  organizationId: string;
  bloodGroup: BloodGroup;
  component: BloodComponent;
  availableUnits: number;
  reservedUnits: number;
  lastUpdated: string;
  quarantinedTempExcursionUnits?: number;
  fridgeTempCelsius?: number;
  coldChainStatus?: ColdChainStatus;
  expiringWithin7DaysUnits?: number;
}

export interface TimelineEvent {
  label: string;
  status: BloodRequestStatus;
  timestamp?: string;
  detail?: string;
}

export interface BloodRequest {
  id: string;
  reference: string;
  hospitalId: string;
  hospitalName: string;
  providerId?: string;
  providerName?: string;
  bloodGroup: BloodGroup;
  component: BloodComponent;
  units: number;
  reservedUnits: number;
  urgency: RequestUrgency;
  status: BloodRequestStatus;
  createdAt: string;
  updatedAt: string;
  deliveredAt?: string;
  distanceKm?: number;
  estimatedTransitHours?: number;
  unknownPatientBloodGroup?: boolean;
  matchType?: MatchCompatibilityType;
  coldChainVerified?: boolean;
  clinicalReference?: string;
  notes?: string;
  createdBy?: string;
  timeline: TimelineEvent[];
}

export interface Candidate {
  organizationId: string;
  facilityCode?: string;
  facilityTier?: FacilityTier;
  organizationName: string;
  location?: string;
  bloodGroup: BloodGroup;
  offeredBloodGroup?: BloodGroup;
  component: BloodComponent;
  unitsFree: number;
  distanceKm?: number;
  estimatedTransitHours?: number;
  fulfilmentMinutes?: number;
  canFullyFulfil: boolean;
  rank: number;
  coordinates?: { x: number; y: number };
  matchType?: MatchCompatibilityType;
  coldChainVerified?: boolean;
  fridgeTempCelsius?: number;
  quarantinedUnitsExcluded?: number;
  conservationRuleApplied?: boolean;
  recommendationReasons?: string[];
}

export interface ActivityItem {
  id: string;
  title: string;
  detail: string;
  timestamp: string;
  tone: "success" | "warning" | "critical" | "info" | "neutral";
}
