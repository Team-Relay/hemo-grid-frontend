/** Verifies the transport-to-view-model contract and v2 Smart Dispatch enrichments. */

import { describe, expect, it } from "vitest";

import type {
  BackendBloodRequest,
  BackendCandidate,
  BackendInventoryItem,
} from "@/lib/api/backend-types";
import {
  displayRequestReference,
  mapBloodRequest,
  mapCandidate,
  mapInventoryItem,
} from "@/lib/api/mappers";

const request: BackendBloodRequest = {
  id: "8ff167fa-258d-4f44-8894-c93f480db939",
  requester: { id: "hospital-1", name: "Central Hospital", type: "HOSPITAL" },
  provider: { id: "bank-1", name: "City Blood Bank", type: "BLOOD_BANK" },
  bloodGroup: "O_NEGATIVE",
  component: "RED_CELLS",
  unitsRequired: 3,
  urgency: "CRITICAL",
  status: "ACCEPTED",
  clinicalReference: "TRAUMA-42",
  notes: null,
  requestedAt: "2026-11-10T08:00:00Z",
  acceptedAt: "2026-11-10T08:02:00Z",
  preparingAt: null,
  dispatchedAt: null,
  deliveredAt: null,
  cancelledAt: null,
  updatedAt: "2026-11-10T08:02:00Z",
};

describe("request mappers", () => {
  it("maps supported fields and derives reserved units from lifecycle status", () => {
    const result = mapBloodRequest(request, new Date("2026-11-10T08:07:00Z"));

    expect(result).toMatchObject({
      id: request.id,
      reference: "HG-8FF167FA",
      hospitalName: "Central Hospital",
      providerName: "City Blood Bank",
      reservedUnits: 3,
      updatedAt: "5 minutes ago",
      unknownPatientBloodGroup: false,
    });
    expect(result.timeline.map((event) => event.label)).toEqual([
      "Request created",
      "Provider selected",
      "Accepted",
    ]);
  });

  it("detects the Emergency Unknown Blood Group Universal O- protocol from notes or flag", () => {
    const unknownGroupRequest: BackendBloodRequest = {
      ...request,
      notes: "[EMERGENCY UNKNOWN BLOOD GROUP — UNIVERSAL O− PROTOCOL] Road traffic trauma",
    };

    const result = mapBloodRequest(unknownGroupRequest, new Date("2026-11-10T08:07:00Z"));
    expect(result.unknownPatientBloodGroup).toBe(true);
  });

  it("never invents a readable suffix outside the UUID", () => {
    expect(displayRequestReference(request.id)).toBe("HG-8FF167FA");
  });
});

describe("inventory mappers", () => {
  it("uses the authenticated organization, backend update timestamp, and v2 cold-chain telemetry", () => {
    const item: BackendInventoryItem = {
      id: "inventory-1",
      bloodGroup: "A_POSITIVE",
      component: "PLASMA",
      unitsAvailable: 12,
      unitsReserved: 2,
      unitsFree: 10,
      updatedAt: "2026-11-10T09:00:00Z",
    };

    expect(mapInventoryItem(item, "bank-1", new Date("2026-11-10T09:01:00Z"))).toMatchObject({
      id: "inventory-1",
      organizationId: "bank-1",
      bloodGroup: "A_POSITIVE",
      component: "PLASMA",
      availableUnits: 12,
      reservedUnits: 2,
      lastUpdated: "1 minute ago",
      coldChainStatus: "VERIFIED_2_6C",
    });
  });
});

describe("candidate mappers", () => {
  it("enriches provider candidates with road transit ETA, cold-chain verification, and recommendation reasons", () => {
    const candidate: BackendCandidate = {
      organizationId: "bank-1",
      organizationName: "Central Regional Blood Center",
      bloodGroup: "A_POSITIVE",
      component: "RED_CELLS",
      unitsFree: 12,
      canFullyFulfil: true,
      distanceKm: 4.2,
      rank: 1,
    };

    const mapped = mapCandidate(candidate);
    expect(mapped).toMatchObject({
      organizationId: "bank-1",
      organizationName: "Central Regional Blood Center",
      rank: 1,
      canFullyFulfil: true,
      matchType: "EXACT",
      coldChainVerified: true,
      conservationRuleApplied: true,
    });
    expect(mapped.estimatedTransitHours).toBeGreaterThan(0);
    expect(mapped.recommendationReasons?.length).toBeGreaterThan(0);
  });
});
