/**
 * Pure transport-to-view-model mappers.
 *
 * Backend DTO names remain isolated here so the existing UI can keep its
 * presentation-oriented model without manufacturing unsupported API data.
 */

import type { BackendBloodRequest, BackendCandidate } from "@/lib/api/backend-types";
import type { BloodRequest, BloodRequestStatus, Candidate, TimelineEvent } from "@/types/domain";

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
  return {
    organizationId: dto.organizationId,
    organizationName: dto.organizationName,
    bloodGroup: dto.bloodGroup,
    component: dto.component,
    unitsFree: dto.unitsFree,
    distanceKm: dto.distanceKm ?? undefined,
    canFullyFulfil: dto.canFullyFulfil,
    rank: dto.rank,
  };
}

export function mapCandidates(candidates: BackendCandidate[]): Candidate[] {
  return candidates.map(mapCandidate);
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
