/**
 * Pure transport-to-view-model mappers.
 *
 * Backend DTO names remain isolated here so the UI consumes a clean domain
 * model while seamlessly enriching v1 responses with v2 Smart Dispatch fields.
 */

import type {
  BackendBloodRequest,
  BackendCandidate,
  BackendInventoryItem,
} from "@/lib/api/backend-types";
import { formatBloodGroup, formatComponent } from "@/lib/domain";
import type {
  BloodRequest,
  BloodRequestStatus,
  Candidate,
  ColdChainStatus,
  FacilityTier,
  InventoryItem,
  TimelineEvent,
} from "@/types/domain";

const AVERAGE_CORRIDOR_SPEED_KMH = 42;

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat("en-NG", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Africa/Lagos",
});

const DATE_FORMATTER = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  timeZone: "Africa/Lagos",
});

const RESERVED_STATUSES: readonly BloodRequestStatus[] = ["ACCEPTED", "PREPARING", "IN_TRANSIT"];

export function mapBloodRequest(dto: BackendBloodRequest, now = new Date()): BloodRequest {
  const unknownPatientBloodGroup =
    dto.unknownPatientBloodGroup ??
    Boolean(dto.notes?.includes("[EMERGENCY UNKNOWN BLOOD GROUP"));

  return {
    id: dto.id,
    reference: displayRequestReference(dto.id),
    hospitalId: dto.requester.id,
    hospitalName: dto.requester.name,
    providerId: dto.provider?.id,
    providerName: dto.provider?.name,
    bloodGroup: dto.bloodGroup,
    component: dto.component,
    units: dto.unitsRequired,
    reservedUnits: RESERVED_STATUSES.includes(dto.status) ? dto.unitsRequired : 0,
    urgency: dto.urgency,
    status: dto.status,
    createdAt: formatDateTime(dto.requestedAt),
    updatedAt: formatRelativeTime(dto.updatedAt, now),
    deliveredAt: dto.deliveredAt ?? undefined,
    estimatedTransitHours: dto.estimatedTransitHours ?? undefined,
    unknownPatientBloodGroup,
    matchType: dto.matchType ?? "EXACT",
    coldChainVerified: dto.coldChainVerified ?? true,
    clinicalReference: dto.clinicalReference ?? undefined,
    notes: dto.notes ?? undefined,
    timeline: mapRequestTimeline(dto),
  };
}

export function mapBloodRequests(
  requests: BackendBloodRequest[],
  now = new Date(),
): BloodRequest[] {
  return requests.map((request) => mapBloodRequest(request, now));
}

export function mapCandidate(dto: BackendCandidate): Candidate {
  const distanceKm = dto.distanceKm ?? undefined;
  const estimatedTransitHours =
    dto.estimatedTransitHours !== undefined && dto.estimatedTransitHours !== null
      ? dto.estimatedTransitHours
      : distanceKm !== undefined
        ? Number(Math.max(0.25, distanceKm / AVERAGE_CORRIDOR_SPEED_KMH).toFixed(2))
        : undefined;

  const facilityTier: FacilityTier =
    dto.facilityTier ??
    (dto.organizationName.toLowerCase().includes("satellite") ? "SATELLITE" : "RBTC");

  const matchType = dto.matchType ?? "EXACT";
  const offeredBloodGroup = dto.offeredBloodGroup ?? dto.bloodGroup;
  const coldChainVerified = dto.coldChainVerified ?? true;
  const fridgeTempCelsius = dto.fridgeTempCelsius ?? 3.8;
  const quarantinedUnitsExcluded = dto.quarantinedUnitsExcluded ?? 0;
  const conservationRuleApplied = dto.conservationRuleApplied ?? dto.bloodGroup !== "O_NEGATIVE";

  const defaultReasons: string[] = [
    matchType === "EXACT"
      ? `Exact ${formatBloodGroup(dto.bloodGroup)} ${formatComponent(dto.component).toLowerCase()} match (${dto.unitsFree} free units) — preserves universal O− stock.`
      : `Verified ABO/Rh-compatible ${formatBloodGroup(offeredBloodGroup)} substitute (${dto.unitsFree} free units).`,
    estimatedTransitHours !== undefined && distanceKm !== undefined
      ? `Verified road corridor: ${estimatedTransitHours} hrs ETA (${distanceKm} km).`
      : "Verified regional dispatch corridor.",
    `Cold-chain telemetry verified at ${fridgeTempCelsius.toFixed(1)}°C (2°C–6°C window).`,
  ];

  return {
    organizationId: dto.organizationId,
    organizationName: dto.organizationName,
    facilityCode: dto.facilityCode,
    facilityTier,
    bloodGroup: dto.bloodGroup,
    offeredBloodGroup,
    component: dto.component,
    unitsFree: dto.unitsFree,
    distanceKm,
    estimatedTransitHours,
    canFullyFulfil: dto.canFullyFulfil,
    rank: dto.rank,
    matchType,
    coldChainVerified,
    fridgeTempCelsius,
    quarantinedUnitsExcluded,
    conservationRuleApplied,
    recommendationReasons: dto.recommendationReasons ?? defaultReasons,
  };
}

export function mapCandidates(candidates: BackendCandidate[]): Candidate[] {
  return candidates.map(mapCandidate);
}

/** Maps bank-scoped inventory and supplies the trusted organization from the session read. */
export function mapInventoryItem(
  dto: BackendInventoryItem,
  organizationId: string,
  now = new Date(),
): InventoryItem {
  const quarantinedTempExcursionUnits = dto.quarantinedTempExcursionUnits ?? 0;
  const fridgeTempCelsius = dto.fridgeTempCelsius ?? 3.8;
  const coldChainStatus: ColdChainStatus =
    dto.coldChainStatus ??
    (quarantinedTempExcursionUnits > 0 ? "EXCURSION_QUARANTINED" : "VERIFIED_2_6C");

  return {
    id: dto.id,
    organizationId,
    bloodGroup: dto.bloodGroup,
    component: dto.component,
    availableUnits: dto.unitsAvailable,
    reservedUnits: dto.unitsReserved,
    quarantinedTempExcursionUnits,
    fridgeTempCelsius,
    coldChainStatus,
    expiringWithin7DaysUnits: dto.expiringWithin7DaysUnits ?? 0,
    lastUpdated: formatRelativeTime(dto.updatedAt, now),
  };
}

export function mapInventoryItems(
  items: BackendInventoryItem[],
  organizationId: string,
  now = new Date(),
): InventoryItem[] {
  return items.map((item) => mapInventoryItem(item, organizationId, now));
}

export function displayRequestReference(id: string): string {
  const compactId = id.replaceAll("-", "").slice(0, 8).toUpperCase();
  return `HG-${compactId}`;
}

export function formatDateTime(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : DATE_TIME_FORMATTER.format(date);
}

export function formatRelativeTime(value: string, now = new Date()): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const differenceSeconds = Math.round((date.getTime() - now.getTime()) / 1_000);
  const absoluteSeconds = Math.abs(differenceSeconds);
  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  if (absoluteSeconds < 60) return formatter.format(differenceSeconds, "second");
  if (absoluteSeconds < 3_600)
    return formatter.format(Math.round(differenceSeconds / 60), "minute");
  if (absoluteSeconds < 86_400)
    return formatter.format(Math.round(differenceSeconds / 3_600), "hour");
  if (absoluteSeconds < 604_800)
    return formatter.format(Math.round(differenceSeconds / 86_400), "day");

  return formatDateTime(value);
}

export function isTodayInLagos(value: string | null, now = new Date()): boolean {
  if (!value) return false;
  const date = new Date(value);
  return (
    !Number.isNaN(date.getTime()) && DATE_FORMATTER.format(date) === DATE_FORMATTER.format(now)
  );
}

function mapRequestTimeline(dto: BackendBloodRequest): TimelineEvent[] {
  const events: TimelineEvent[] = [
    event("Request created", "REQUESTED", dto.requestedAt, "Network search started"),
  ];

  if (dto.provider) {
    events.push({
      label: "Provider selected",
      status: "REQUESTED",
      detail: dto.provider.name,
    });
  }

  pushTimestampedEvent(events, "Accepted", "ACCEPTED", dto.acceptedAt);
  pushTimestampedEvent(events, "Preparing", "PREPARING", dto.preparingAt);
  pushTimestampedEvent(events, "In transit", "IN_TRANSIT", dto.dispatchedAt);
  pushTimestampedEvent(events, "Delivered", "DELIVERED", dto.deliveredAt);
  pushTimestampedEvent(events, "Cancelled", "CANCELLED", dto.cancelledAt);

  if (dto.status === "DECLINED" || dto.status === "EXPIRED") {
    events.push(event(statusLabel(dto.status), dto.status, dto.updatedAt));
  }

  return events;
}

function pushTimestampedEvent(
  events: TimelineEvent[],
  label: string,
  status: BloodRequestStatus,
  timestamp: string | null,
): void {
  if (timestamp) events.push(event(label, status, timestamp));
}

function event(
  label: string,
  status: BloodRequestStatus,
  timestamp: string,
  detail?: string,
): TimelineEvent {
  return { label, status, timestamp: formatDateTime(timestamp), detail };
}

function statusLabel(status: BloodRequestStatus): string {
  return status.charAt(0) + status.slice(1).toLowerCase().replaceAll("_", " ");
}
