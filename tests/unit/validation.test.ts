/** Exercises validation at the untrusted form boundary before requests reach Spring Boot. */

import { describe, expect, it } from "vitest";

import {
  createBloodRequestSchema,
  providerIdSchema,
  requestIdSchema,
} from "@/lib/validation/blood-request";
import { inventoryUpdateSchema, providerRequestMutationSchema } from "@/lib/validation/provider";

const requestId = "8ff167fa-258d-4f44-8894-c93f480db939";

describe("hospital request validation", () => {
  it("coerces quantities and trims optional values", () => {
    const result = createBloodRequestSchema.parse({
      bloodGroup: "O_NEGATIVE",
      component: "RED_CELLS",
      unitsRequired: "3",
      urgency: "CRITICAL",
      clinicalReference: "  TRAUMA-42  ",
      notes: "   ",
    });

    expect(result).toMatchObject({
      unitsRequired: 3,
      clinicalReference: "TRAUMA-42",
      notes: undefined,
    });
  });

  it("rejects out-of-range quantities and malformed identifiers", () => {
    expect(
      createBloodRequestSchema.safeParse({
        bloodGroup: "O_NEGATIVE",
        component: "RED_CELLS",
        unitsRequired: 21,
        urgency: "CRITICAL",
        clinicalReference: "",
        notes: "",
      }).success,
    ).toBe(false);
    expect(requestIdSchema.safeParse("not-a-uuid").success).toBe(false);
    expect(providerIdSchema.safeParse("not-a-uuid").success).toBe(false);
  });

  it("accepts deterministic UUID-shaped provider IDs used by Java and PostgreSQL", () => {
    expect(providerIdSchema.safeParse("22222222-2222-2222-2222-222222222222").success).toBe(true);
  });
});

describe("provider validation", () => {
  it("accepts documented lifecycle intents", () => {
    expect(providerRequestMutationSchema.parse({ requestId, intent: "IN_TRANSIT" })).toEqual({
      requestId,
      intent: "IN_TRANSIT",
    });
  });

  it("rejects negative or fractional inventory values", () => {
    expect(
      inventoryUpdateSchema.safeParse({ inventoryId: requestId, unitsAvailable: -1 }).success,
    ).toBe(false);
    expect(
      inventoryUpdateSchema.safeParse({ inventoryId: requestId, unitsAvailable: 1.5 }).success,
    ).toBe(false);
  });

  it("accepts deterministic UUID-shaped inventory IDs", () => {
    expect(
      inventoryUpdateSchema.safeParse({
        inventoryId: "30000000-0000-0000-0000-000000000008",
        unitsAvailable: 5,
      }).success,
    ).toBe(true);
  });
});
