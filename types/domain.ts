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
export type FacilityStatus = "ONLINE" | "DEGRADED" | "OFFLINE";
export type StockHealth = "HEALTHY" | "MODERATE" | "LOW" | "CRITICAL";

export interface Organization {
  id: string;
  name: string;
  type: OrganizationType;
  location: string;
  coordinates: { x: number; y: number };
  networkStatus: FacilityStatus;
  lastUpdated: string;
  activeRequests: number;
  totalStock?: number;
}

export interface InventoryItem {
  id: string;
  organizationId: string;
  bloodGroup: BloodGroup;
  component: BloodComponent;
  availableUnits: number;
  reservedUnits: number;
  lastUpdated: string;
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
  clinicalReference?: string;
  notes?: string;
  createdBy?: string;
  timeline: TimelineEvent[];
}

export interface Candidate {
  organizationId: string;
  organizationName: string;
  location?: string;
  bloodGroup: BloodGroup;
  component: BloodComponent;
  unitsFree: number;
  distanceKm?: number;
  fulfilmentMinutes?: number;
  canFullyFulfil: boolean;
  rank: number;
  coordinates?: { x: number; y: number };
}

export interface ActivityItem {
  id: string;
  title: string;
  detail: string;
  timestamp: string;
  tone: "success" | "warning" | "critical" | "info" | "neutral";
}
