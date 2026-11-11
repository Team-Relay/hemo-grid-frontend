/** Verifies the transport-to-view-model contract and v2 Smart Dispatch enrichments. */

import { describe, expect, it } from "vitest";
import { getFreeUnits } from "@/lib/domain";

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
  isTodayInNairobi,
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
      coldChainStatus: undefined,
      fridgeTempCelsius: undefined,
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
      matchType: undefined,
      coldChainVerified: undefined,
      conservationRuleApplied: undefined,
    });
    expect(mapped.estimatedTransitHours).toBeUndefined();
    expect(mapped.recommendationReasons).toContain("Cold-chain verification was not supplied; qualified staff must confirm.");
  });
});

describe("source evidence and Kenyan time", () => {
  it("never labels unreported cold-chain telemetry or travel time as verified", () => {
    const item: BackendInventoryItem = {
      id: "inventory-unknown",
      bloodGroup: "O_NEGATIVE",
      component: "RED_CELLS",
      unitsAvailable: 10,
      unitsReserved: 2,
      unitsFree: 8,
      updatedAt: "2026-11-10T09:00:00Z",
    };
    const mapped = mapInventoryItem(item, "bank-1");
    expect(mapped.coldChainStatus).toBeUndefined();
    expect(mapped.fridgeTempCelsius).toBeUndefined();
    expect(getFreeUnits(mapped)).toBe(0);
  });

  it("uses backend dispatchable units after quarantine rather than raw free units", () => {
    const item: BackendInventoryItem = {
      id: "inventory-safe",
      bloodGroup: "O_NEGATIVE",
      component: "RED_CELLS",
      unitsAvailable: 10,
      unitsReserved: 2,
      unitsFree: 8,
      dispatchableUnitsFree: 5,
      coldChainStatus: "VERIFIED_2_6C",
      coldChainVerified: true,
      fridgeTempCelsius: 3.8,
      quarantinedTempExcursionUnits: 3,
      updatedAt: "2026-11-10T09:00:00Z",
    };
    const mapped = mapInventoryItem(item, "bank-1");
    expect(getFreeUnits(mapped)).toBe(5);
    expect(mapped.fridgeTempCelsius).toBe(3.8);
    expect(mapped.coldChainStatus).toBe("VERIFIED_2_6C");
  });

  it("uses Nairobi rather than Lagos for delivered-today counts", () => {
    const now = new Date("2026-11-11T00:30:00+03:00");
    expect(isTodayInNairobi("2026-11-10T22:05:00Z", now)).toBe(true);
    expect(isTodayInNairobi("2026-11-10T20:10:00Z", now)).toBe(false);
  });
});
