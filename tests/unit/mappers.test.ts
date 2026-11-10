/** Verifies the transport-to-view-model contract without rendering the application. */

import { describe, expect, it } from "vitest";

import type { BackendBloodRequest, BackendInventoryItem } from "@/lib/api/backend-types";
import { displayRequestReference, mapBloodRequest, mapInventoryItem } from "@/lib/api/mappers";

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
  requestedAt: "2026-08-25T08:00:00Z",
  acceptedAt: "2026-08-25T08:02:00Z",
  preparingAt: null,
  dispatchedAt: null,
  deliveredAt: null,
  cancelledAt: null,
  updatedAt: "2026-08-25T08:02:00Z",
};

describe("request mappers", () => {
  it("maps supported fields and derives reserved units from lifecycle status", () => {
    const result = mapBloodRequest(request, new Date("2026-08-25T08:07:00Z"));

    expect(result).toMatchObject({
      id: request.id,
      reference: "HG-8FF167FA",
      hospitalName: "Central Hospital",
      providerName: "City Blood Bank",
      reservedUnits: 3,
      updatedAt: "5 minutes ago",
    });
    expect(result.timeline.map((event) => event.label)).toEqual([
      "Request created",
      "Provider selected",
      "Accepted",
    ]);
  });

  it("never invents a readable suffix outside the UUID", () => {
    expect(displayRequestReference(request.id)).toBe("HG-8FF167FA");
  });
});

describe("inventory mappers", () => {
  it("uses the authenticated organization and backend update timestamp", () => {
    const item: BackendInventoryItem = {
      id: "inventory-1",
      bloodGroup: "A_POSITIVE",
      component: "PLASMA",
      unitsAvailable: 12,
      unitsReserved: 2,
      unitsFree: 10,
      updatedAt: "2026-08-25T09:00:00Z",
    };

    expect(mapInventoryItem(item, "bank-1", new Date("2026-08-25T09:01:00Z"))).toEqual({
      id: "inventory-1",
      organizationId: "bank-1",
      bloodGroup: "A_POSITIVE",
      component: "PLASMA",
      availableUnits: 12,
      reservedUnits: 2,
      lastUpdated: "1 minute ago",
    });
  });
});
