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
import { formatComponent } from "@/lib/domain";
import type {
  BloodRequest,
  BloodRequestStatus,
  Candidate,
  ColdChainStatus,
  FacilityTier,
  InventoryItem,
  TimelineEvent,
} from "@/types/domain";

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat("en-KE", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Africa/Nairobi",
});

const DATE_FORMATTER = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  timeZone: "Africa/Nairobi",
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
    coldChainVerified: dto.coldChainVerified,
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
  // Display source evidence only. Never substitute a simulated ETA, temperature,
  // compatibility decision or cold-chain verification for a missing API field.
  const distanceKm = dto.distanceKm ?? undefined;
  const estimatedTransitHours = dto.estimatedTransitHours ?? undefined;
  const facilityTier: FacilityTier =
    dto.facilityTier ??
    (dto.organizationName.toLowerCase().includes("satellite") ? "SATELLITE" : "RBTC");

  const matchType = dto.matchType;
  const offeredBloodGroup = dto.offeredBloodGroup;
  const coldChainVerified = dto.coldChainVerified;
  const fridgeTempCelsius = dto.fridgeTempCelsius;
  const quarantinedUnitsExcluded = dto.quarantinedUnitsExcluded;
  const conservationRuleApplied = dto.conservationRuleApplied;

  const defaultReasons: string[] = [
    `Candidate snapshot: ${dto.unitsFree} free ${formatComponent(dto.component).toLowerCase()} units recorded.`,
    estimatedTransitHours !== undefined
      ? `Recorded estimated travel: ${estimatedTransitHours} hours; confirm with dispatch staff.`
      : "Estimated transport time unavailable; confirm before dispatch.",
    coldChainVerified === true
      ? "Recorded cold-chain check passed; qualified staff must still authorize release."
      : coldChainVerified === false
        ? "Recorded cold-chain check failed; do not dispatch."
        : "Cold-chain verification was not supplied; qualified staff must confirm.",
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
  // An absent reading or status must remain unknown, not fabricated as verified.
  const quarantinedTempExcursionUnits = dto.quarantinedTempExcursionUnits;
  const fridgeTempCelsius = dto.fridgeTempCelsius;
  const coldChainStatus: ColdChainStatus | undefined = dto.coldChainStatus;

  return {
    id: dto.id,
    organizationId,
    bloodGroup: dto.bloodGroup,
    component: dto.component,
    availableUnits: dto.unitsAvailable,
    reservedUnits: dto.unitsReserved,
    dispatchableUnitsFree: dto.dispatchableUnitsFree,
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

export function isTodayInNairobi(value: string | null, now = new Date()): boolean {
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
