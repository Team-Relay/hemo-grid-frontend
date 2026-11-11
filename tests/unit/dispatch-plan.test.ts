/** Unit tests for Dispatch Planner validation, baseline comparison, handoff formatting, and conflict handling. */

import { describe, expect, it } from "vitest";

import type { BackendBloodRequest, BackendDispatchPlanResponse } from "@/lib/api/backend-types";
import { isDispatchPlanConflictError } from "@/lib/api/dispatch-plans";
import { ApiClientError } from "@/lib/api/errors";
import {
  canCompareBaselineTransitHours,
  formatBatchHandoffText,
  getDispatchPlanStatusMeta,
  getTransitHoursSavedVsBaseline,
  requiresManualFallback,
  toggleSelectedRequestId,
} from "@/lib/dispatch-plan";
import { createDispatchPlanSchema } from "@/lib/validation/dispatch-plan";

const ID_1 = "e1000001-0000-0000-0000-000000000001";
const ID_2 = "e1000002-0000-0000-0000-000000000002";
const ID_3 = "e1000003-0000-0000-0000-000000000003";
const ID_4 = "e1000004-0000-0000-0000-000000000004";
const ID_5 = "e1000005-0000-0000-0000-000000000005";
const ID_6 = "e1000006-0000-0000-0000-000000000006";

function makeSamplePlan(
  overrides: Partial<BackendDispatchPlanResponse> = {},
): BackendDispatchPlanResponse {
  return {
    generatedAt: "2026-11-11T00:15:00Z",
    status: "OPTIMAL",
    totalEstimatedTransitHours: 3.26,
    visitedNodes: 4,
    nearestEligibleBaseline: {
      status: "OPTIMAL",
      assignments: [
        { orderId: ID_1, stockId: "stk-1", transitHours: 0.67 },
        { orderId: ID_2, stockId: "stk-2", transitHours: 3.13 },
      ],
      totalTransitHours: 3.8,
      visitedNodes: 2,
    },
    proposals: [
      {
        requestId: ID_1,
        requesterOrganizationId: "a010a023-0654-5116-bbd2-4f585fcda872",
        providerOrganizationId: "44444444-4444-4444-4444-444444444444",
        providerName: "Embu Regional Blood Transfusion Centre",
        offeredBloodGroup: "O_NEGATIVE",
        inventoryId: "inv-1",
        inventoryVersion: 3,
        unitsRequired: 4,
        dispatchableUnitsAtPlanning: 7,
        unitsRemainingAfterWholePlan: 3,
        estimatedTransitHours: 2.96,
        recordedFridgeTempCelsius: 4.1,
        inventoryUpdatedAt: "2026-11-11T00:10:00Z",
        rationale:
          "Proposes 4 units from 7 recorded dispatchable units. 3 remain after the whole batch. Staff confirmation is required.",
      },
      {
        requestId: ID_2,
        requesterOrganizationId: "11111111-1111-1111-1111-111111111111",
        providerOrganizationId: "22222222-2222-2222-2222-222222222222",
        providerName: "Nairobi Regional Blood Transfusion Centre",
        offeredBloodGroup: "O_NEGATIVE",
        inventoryId: "inv-2",
        inventoryVersion: 5,
        unitsRequired: 3,
        dispatchableUnitsAtPlanning: 5,
        unitsRemainingAfterWholePlan: 2,
        estimatedTransitHours: 0.3,
        recordedFridgeTempCelsius: 3.8,
        inventoryUpdatedAt: "2026-11-11T00:10:00Z",
        rationale:
          "Proposes 3 units from 5 recorded dispatchable units. 2 remain after the whole batch. Staff confirmation is required.",
      },
    ],
    notes: [
      "Hospital officers select the proposed providers through the existing request workflow.",
    ],
    ...overrides,
  };
}

describe("dispatch plan schema validation", () => {
  it("accepts 2 to 5 distinct seeded UUIDs when staffApproved is true", () => {
    const parsed = createDispatchPlanSchema.parse({
      requestIds: [ID_1, ID_2],
      staffApproved: true,
    });
    expect(parsed.requestIds).toEqual([ID_1, ID_2]);
    expect(parsed.staffApproved).toBe(true);
  });

  it("rejects fewer than 2, more than 5, duplicates, and unapproved batches", () => {
    expect(
      createDispatchPlanSchema.safeParse({ requestIds: [ID_1], staffApproved: true }).success,
    ).toBe(false);
    expect(
      createDispatchPlanSchema.safeParse({
        requestIds: [ID_1, ID_2, ID_3, ID_4, ID_5, ID_6],
        staffApproved: true,
      }).success,
    ).toBe(false);
    expect(
      createDispatchPlanSchema.safeParse({ requestIds: [ID_1, ID_1], staffApproved: true }).success,
    ).toBe(false);
    expect(
      createDispatchPlanSchema.safeParse({ requestIds: [ID_1, ID_2], staffApproved: false }).success,
    ).toBe(false);
  });
});

describe("manual human-led fallback policy", () => {
  it("is offered for failed service calls and incomplete planning, never for valid complete plans", () => {
    expect(requiresManualFallback(null, true)).toBe(true);
    expect(requiresManualFallback("INFEASIBLE", false)).toBe(true);
    expect(requiresManualFallback("LIMIT_REACHED", false)).toBe(true);
    expect(requiresManualFallback("OPTIMAL", false)).toBe(false);
    expect(requiresManualFallback("FEASIBLE", false)).toBe(false);
    expect(requiresManualFallback(null, false)).toBe(false);
  });
});

describe("dispatch planner status, baseline comparison, and handoff", () => {
  it("returns exact required coordinator status descriptions", () => {
    expect(getDispatchPlanStatusMeta("OPTIMAL").description).toBe(
      "Complete plan with lowest estimated journey total for the current options",
    );
    expect(getDispatchPlanStatusMeta("FEASIBLE").description).toBe(
      "Complete plan found, with optimality unproven",
    );
    expect(getDispatchPlanStatusMeta("INFEASIBLE").description).toBe(
      "Staff review required because the whole batch cannot be filled",
    );
    expect(getDispatchPlanStatusMeta("LIMIT_REACHED").description).toBe(
      "Staff review required because the search budget was exhausted",
    );
  });

  it("compares baseline summed estimated journey hours only when both are complete", () => {
    const completePlan = makeSamplePlan();
    expect(canCompareBaselineTransitHours(completePlan)).toBe(true);
    expect(getTransitHoursSavedVsBaseline(completePlan)).toBe(0.54);

    const incompleteBaseline = makeSamplePlan({
      nearestEligibleBaseline: {
        status: "INFEASIBLE",
        assignments: [{ orderId: ID_1, stockId: "stk-1", transitHours: 0.67 }],
        totalTransitHours: null,
        visitedNodes: 1,
      },
    });
    expect(canCompareBaselineTransitHours(incompleteBaseline)).toBe(false);
    expect(getTransitHoursSavedVsBaseline(incompleteBaseline)).toBeNull();
  });

  it("caps request selection at 5 items while allowing toggle-off", () => {
    const five = [ID_1, ID_2, ID_3, ID_4, ID_5];
    expect(toggleSelectedRequestId(five, ID_6)).toEqual({
      nextIds: five,
      hitLimit: true,
    });
    expect(toggleSelectedRequestId(five, ID_3)).toEqual({
      nextIds: [ID_1, ID_2, ID_4, ID_5],
      hitLimit: false,
    });
  });

  it("formats copyable handoff instructions with existing approval workflow endpoints", () => {
    const requestsById = new Map<string, BackendBloodRequest>([
      [
        ID_1,
        {
          id: ID_1,
          requester: {
            id: "a010a023-0654-5116-bbd2-4f585fcda872",
            name: "Eastlands County Hospital",
            type: "HOSPITAL",
          },
          provider: null,
          bloodGroup: "O_NEGATIVE",
          component: "RED_CELLS",
          unitsRequired: 4,
          urgency: "CRITICAL",
          status: "REQUESTED",
          clinicalReference: "BATCH-DEMO-HSP002",
          notes: null,
          requestedAt: "2026-11-11T00:00:00Z",
          acceptedAt: null,
          preparingAt: null,
          dispatchedAt: null,
          deliveredAt: null,
          cancelledAt: null,
          updatedAt: "2026-11-11T00:00:00Z",
        },
      ],
    ]);

    const handoff = formatBatchHandoffText(makeSamplePlan(), requestsById);
    expect(handoff).toContain("Summed estimated journey hours (Joint Plan): 3.26h");
    expect(handoff).toContain("Summed estimated journey hours (Nearest Eligible Baseline): 3.80h");
    expect(handoff).toContain(`/api/v1/blood-requests/${ID_1}/select-provider`);
    expect(handoff).toContain('"providerOrganizationId":"44444444-4444-4444-4444-444444444444"');
    expect(handoff).toContain(`/api/v1/provider/requests/${ID_1}/accept`);
  });

  it("identifies stock conflict and cold-chain hold API errors", () => {
    expect(
      isDispatchPlanConflictError(
        new ApiClientError({ code: "COLD_CHAIN_HOLD", status: 409, message: "Hold" }),
      ),
    ).toBe(true);
    expect(
      isDispatchPlanConflictError(
        new ApiClientError({ code: "INSUFFICIENT_INVENTORY", status: 409, message: "Short" }),
      ),
    ).toBe(true);
    expect(
      isDispatchPlanConflictError(
        new ApiClientError({ code: "FORBIDDEN", status: 403, message: "Forbidden" }),
      ),
    ).toBe(false);
  });
});
