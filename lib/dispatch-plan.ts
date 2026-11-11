/**
 * Pure presentation, baseline comparison, and handoff helpers for the
 * PLATFORM_ADMIN Joint Dispatch Planner.
 */

import type {
  BackendBloodRequest,
  BackendDispatchPlanResponse,
  BackendDispatchProposal,
  DispatchPlanStatus,
} from "@/lib/api/backend-types";
import type { FeedbackTone } from "@/components/ui/core";
import { formatBloodGroup } from "@/lib/domain";

export const MIN_DISPATCH_BATCH_SIZE = 2;
export const MAX_DISPATCH_BATCH_SIZE = 5;

const PLANNER_DATE_TIME_FORMATTER = new Intl.DateTimeFormat("en-KE", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Africa/Nairobi",
});

export interface DispatchPlanStatusMeta {
  label: string;
  tone: FeedbackTone;
  description: string;
}

const STATUS_META: Record<DispatchPlanStatus, DispatchPlanStatusMeta> = {
  OPTIMAL: {
    label: "OPTIMAL",
    tone: "success",
    description: "Complete plan with lowest estimated journey total for the current options",
  },
  FEASIBLE: {
    label: "FEASIBLE",
    tone: "info",
    description: "Complete plan found, with optimality unproven",
  },
  INFEASIBLE: {
    label: "INFEASIBLE",
    tone: "critical",
    description: "Staff review required because the whole batch cannot be filled",
  },
  LIMIT_REACHED: {
    label: "LIMIT_REACHED",
    tone: "warning",
    description: "Staff review required because the search budget was exhausted",
  },
};

/** A failed/incomplete batch must never be represented as an approved supplier assignment. */
export function requiresManualFallback(
  status: DispatchPlanStatus | null | undefined,
  previewUnavailable: boolean,
): boolean {
  return previewUnavailable || status === "INFEASIBLE" || status === "LIMIT_REACHED";
}

export function getDispatchPlanStatusMeta(status: DispatchPlanStatus): DispatchPlanStatusMeta {
  return STATUS_META[status];
}

export function formatPlannerDateTime(isoTimestamp: string): string {
  const parsed = new Date(isoTimestamp);
  if (Number.isNaN(parsed.getTime())) {
    return isoTimestamp;
  }
  return `${PLANNER_DATE_TIME_FORMATTER.format(parsed)} EAT`;
}

export function canCompareBaselineTransitHours(plan: BackendDispatchPlanResponse): boolean {
  const planComplete =
    plan.proposals.length > 0 &&
    plan.totalEstimatedTransitHours !== null &&
    Number.isFinite(plan.totalEstimatedTransitHours);
  const baselineComplete =
    plan.nearestEligibleBaseline.assignments.length === plan.proposals.length &&
    plan.nearestEligibleBaseline.totalTransitHours !== null &&
    Number.isFinite(plan.nearestEligibleBaseline.totalTransitHours);

  return planComplete && baselineComplete;
}

export function getTransitHoursSavedVsBaseline(plan: BackendDispatchPlanResponse): number | null {
  if (!canCompareBaselineTransitHours(plan)) {
    return null;
  }
  const diff =
    (plan.nearestEligibleBaseline.totalTransitHours ?? 0) -
    (plan.totalEstimatedTransitHours ?? 0);
  return Math.round(diff * 100) / 100;
}

export function toggleSelectedRequestId(
  currentIds: readonly string[],
  requestId: string,
): { nextIds: string[]; hitLimit: boolean } {
  if (currentIds.includes(requestId)) {
    return {
      nextIds: currentIds.filter((id) => id !== requestId),
      hitLimit: false,
    };
  }
  if (currentIds.length >= MAX_DISPATCH_BATCH_SIZE) {
    return {
      nextIds: [...currentIds],
      hitLimit: true,
    };
  }
  return {
    nextIds: [...currentIds, requestId],
    hitLimit: false,
  };
}

export function formatProposalHandoffText(
  proposal: BackendDispatchProposal,
  request?: BackendBloodRequest,
): string {
  const hospitalName = request?.requester.name ?? proposal.requesterOrganizationId;
  const requestedGroup = request ? formatBloodGroup(request.bloodGroup) : "Red Cells";
  const clinicalRef = request?.clinicalReference ? ` (${request.clinicalReference})` : "";

  return [
    `Request: ${proposal.requestId}${clinicalRef}`,
    `Hospital: ${hospitalName} — Requested ${proposal.unitsRequired}u ${requestedGroup} RED_CELLS`,
    `Proposed Supplier: ${proposal.providerName} (${proposal.providerOrganizationId})`,
    `Offered Group: ${formatBloodGroup(proposal.offeredBloodGroup)} | Dispatchable: ${proposal.dispatchableUnitsAtPlanning}u -> Remaining after batch: ${proposal.unitsRemainingAfterWholePlan}u`,
    `Estimated Transit: ${proposal.estimatedTransitHours.toFixed(2)}h | Fridge Temp: ${proposal.recordedFridgeTempCelsius.toFixed(1)}°C`,
    `1) Hospital selection -> POST /api/v1/blood-requests/${proposal.requestId}/select-provider {"providerOrganizationId":"${proposal.providerOrganizationId}"}`,
    `2) Bank reservation   -> POST /api/v1/provider/requests/${proposal.requestId}/accept`,
    `Rationale: ${proposal.rationale}`,
  ].join("\n");
}

export function formatBatchHandoffText(
  plan: BackendDispatchPlanResponse,
  requestsById: ReadonlyMap<string, BackendBloodRequest>,
): string {
  const meta = getDispatchPlanStatusMeta(plan.status);
  const headerLines = [
    `HemoGrid Joint Dispatch Proposal [${meta.label}]`,
    `Status detail: ${meta.description}`,
    `Generated: ${formatPlannerDateTime(plan.generatedAt)}`,
  ];

  if (plan.totalEstimatedTransitHours !== null) {
    headerLines.push(
      `Summed estimated journey hours (Joint Plan): ${plan.totalEstimatedTransitHours.toFixed(2)}h`,
    );
  }
  if (canCompareBaselineTransitHours(plan)) {
    headerLines.push(
      `Summed estimated journey hours (Nearest Eligible Baseline): ${plan.nearestEligibleBaseline.totalTransitHours?.toFixed(2)}h`,
    );
  }

  const body = plan.proposals
    .map((proposal, index) =>
      `[${index + 1}]\n${formatProposalHandoffText(proposal, requestsById.get(proposal.requestId))}`,
    )
    .join("\n\n");

  const notesBlock =
    plan.notes.length > 0 ? `\n\nNotes:\n${plan.notes.map((n) => `- ${n}`).join("\n")}` : "";

  return `${headerLines.join("\n")}\n\n${body}${notesBlock}`;
}
