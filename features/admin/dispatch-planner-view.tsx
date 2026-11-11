/**
 * Client coordinator workspace for joint batch dispatch planning (PLATFORM_ADMIN).
 *
 * Previews stay in coordinator state and never reserve stock or mutate requests.
 */

"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Check,
  CheckSquare,
  Clock,
  Copy,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Square,
  Truck,
} from "lucide-react";

import {
  BloodBadge,
  Button,
  ColdChainBadge,
  EmptyState,
  FeedbackBanner,
  PageHeader,
  Panel,
  SectionHeader,
  UrgencyBadge,
  cn,
  type FeedbackTone,
} from "@/components/ui/core";
import type {
  BackendBloodRequest,
  BackendDispatchPlanResponse,
  BackendDispatchProposal,
} from "@/lib/api/backend-types";
import {
  isDispatchPlanConflictError,
  listDispatchPlanRequests,
  previewDispatchPlan,
} from "@/lib/api/dispatch-plans";
import { ApiClientError } from "@/lib/api/errors";
import { clearClientSessionCookie, getClientAccessToken } from "@/lib/auth/client-session";
import {
  MAX_DISPATCH_BATCH_SIZE,
  MIN_DISPATCH_BATCH_SIZE,
  canCompareBaselineTransitHours,
  formatBatchHandoffText,
  formatPlannerDateTime,
  formatProposalHandoffText,
  getDispatchPlanStatusMeta,
  getTransitHoursSavedVsBaseline,
  toggleSelectedRequestId,
} from "@/lib/dispatch-plan";
import { formatBloodGroup } from "@/lib/domain";
import { createDispatchPlanSchema } from "@/lib/validation/dispatch-plan";

interface PlannerFeedback {
  tone: FeedbackTone;
  title?: string;
  message: string;
}

export function DispatchPlannerView({
  initialRequests,
}: {
  initialRequests: BackendBloodRequest[];
}) {
  const router = useRouter();
  const [refreshedRequests, setRefreshedRequests] = useState<BackendBloodRequest[] | null>(null);
  const requests = refreshedRequests ?? initialRequests;
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [staffApproved, setStaffApproved] = useState(false);
  const [plan, setPlan] = useState<BackendDispatchPlanResponse | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [feedback, setFeedback] = useState<PlannerFeedback | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [manualFallback, setManualFallback] = useState(false);
  const [plannerFailure, setPlannerFailure] = useState<string | null>(null);
  const [connectionUnconfirmed, setConnectionUnconfirmed] = useState(false);

  const requestsById = useMemo(
    () => new Map(requests.map((request) => [request.id, request])),
    [requests],
  );

  function handleSessionExpired() {
    clearClientSessionCookie();
    router.replace("/login?reason=session-expired");
  }

  function clearStaleProposal() {
    setPlan(null);
    setPlannerFailure(null);
  }

  function handleToggleRequest(requestId: string) {
    const { nextIds, hitLimit } = toggleSelectedRequestId(selectedIds, requestId);
    if (hitLimit) {
      setFeedback({
        tone: "warning",
        title: "Maximum batch size reached",
        message: `Select at most ${MAX_DISPATCH_BATCH_SIZE} pending critical red-cell requests in a single preview batch.`,
      });
      return;
    }

    setSelectedIds(nextIds);
    clearStaleProposal();
    if (feedback?.tone === "warning") {
      setFeedback(null);
    }
  }

  function handleSelectTopPair() {
    const nextIds = requests.slice(0, MIN_DISPATCH_BATCH_SIZE).map((r) => r.id);
    setSelectedIds(nextIds);
    clearStaleProposal();
    setFeedback(null);
  }

  function handleClearSelection() {
    setSelectedIds([]);
    setStaffApproved(false);
    clearStaleProposal();
    setFeedback(null);
  }

  function handleStaffApprovalChange(checked: boolean) {
    setStaffApproved(checked);
    clearStaleProposal();
    if (feedback?.tone === "warning") {
      setFeedback(null);
    }
  }

  async function refreshLiveQueue(options?: { keepFeedback?: boolean }) {
    const accessToken = getClientAccessToken();
    if (!accessToken) {
      handleSessionExpired();
      return;
    }

    setIsRefreshing(true);
    try {
      const latest = await listDispatchPlanRequests(accessToken);
      const validIds = new Set(latest.map((item) => item.id));
      setRefreshedRequests(latest);
      setConnectionUnconfirmed(false);
      setSelectedIds((prev) => prev.filter((id) => validIds.has(id)));
      if (options?.keepFeedback) setPlan(null);
      else clearStaleProposal();
      if (!options?.keepFeedback) {
        setFeedback({
          tone: "info",
          title: "Live queue refreshed",
          message: `Loaded ${latest.length} pending critical red-cell request${latest.length === 1 ? "" : "s"} from the server.`,
        });
      }
      router.refresh();
    } catch (error) {
      if (error instanceof ApiClientError && error.status === 401) {
        handleSessionExpired();
        return;
      }
      setConnectionUnconfirmed(true);
      clearStaleProposal();
      setManualFallback(true);
      setFeedback({
        tone: "critical",
        title: "Could not refresh queue",
        message:
          error instanceof Error
            ? error.message
            : "HemoGrid could not reach the dispatch-planning service.",
      });
    } finally {
      setIsRefreshing(false);
    }
  }

  async function handlePreviewPlan() {
    if (isPreviewing) return;

    const validated = createDispatchPlanSchema.safeParse({
      requestIds: selectedIds,
      staffApproved,
    });

    if (!validated.success) {
      setFeedback({
        tone: "warning",
        title: "Review batch selection",
        message: validated.error.issues[0]?.message ?? "Select 2–5 requests and confirm approval.",
      });
      return;
    }

    const accessToken = getClientAccessToken();
    if (!accessToken) {
      handleSessionExpired();
      return;
    }

    setIsPreviewing(true);
    setFeedback(null);
    setPlannerFailure(null);
    setPlan(null); // Never display a past proposal as if it survived a failed preview.

    try {
      const response = await previewDispatchPlan(accessToken, validated.data);
      setPlan(response);
      setConnectionUnconfirmed(false);
      if (response.status === "INFEASIBLE" || response.status === "LIMIT_REACHED") {
        setManualFallback(true);
        setPlannerFailure(response.status);
      } else {
        setPlannerFailure(null);
      }
    } catch (error) {
      if (error instanceof ApiClientError) {
        if (error.status === 401) {
          handleSessionExpired();
          return;
        }
        if (error.status === 403) {
          setFeedback({
            tone: "critical",
            title: "Administrator role required",
            message: "Only PLATFORM_ADMIN accounts can generate joint dispatch previews.",
          });
          return;
        }
        if (isDispatchPlanConflictError(error) || error.status === 404) {
          setManualFallback(true);
          setPlannerFailure("STALE_EVIDENCE");
          clearStaleProposal();
          setStaffApproved(false);
          setFeedback({
            tone: "critical",
            title: "Stock conflict, quarantine hold, or status change detected",
            message: `${error.message} The stale proposal was cleared and live requests were refreshed—review updated availability before retrying.`,
          });
          await refreshLiveQueue({ keepFeedback: true });
          return;
        }
        setManualFallback(true);
        setPlannerFailure("PREVIEW_ERROR");
        setConnectionUnconfirmed(error.code === "NETWORK_ERROR" || error.code === "NETWORK_TIMEOUT");
        setFeedback({
          tone: "critical",
          title: "Preview failed",
          message: error.message,
        });
        return;
      }

      setManualFallback(true);
      setPlannerFailure("PREVIEW_ERROR");
      setConnectionUnconfirmed(true);
      setFeedback({
        tone: "critical",
        title: "Network error",
        message: "HemoGrid could not reach the server. Check your connection and try again.",
      });
    } finally {
      setIsPreviewing(false);
    }
  }

  async function copyToClipboard(key: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      window.setTimeout(() => {
        setCopiedKey((current) => (current === key ? null : current));
      }, 2000);
    } catch {
      setFeedback({
        tone: "warning",
        message: "Clipboard access was blocked by the browser. Copy the handoff details manually.",
      });
    }
  }

  const selectionReady =
    selectedIds.length >= MIN_DISPATCH_BATCH_SIZE && selectedIds.length <= MAX_DISPATCH_BATCH_SIZE;
  const statusMeta = plan ? getDispatchPlanStatusMeta(plan.status) : null;
  const showBaselineComparison = plan ? canCompareBaselineTransitHours(plan) : false;
  const hoursSaved = plan ? getTransitHoursSavedVsBaseline(plan) : null;

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Coordinator decision support"
        title="Joint dispatch planner"
        description="Coordinate 2 to 5 pending critical red-cell requests across shared inventory, inspect corridor journey totals, and copy verified supplier handoffs."
        action={
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => void refreshLiveQueue()}
            isLoading={isRefreshing}
            loadingText="Refreshing…"
          >
            <RefreshCw size={14} /> Refresh live queue
          </Button>
        }
      />

      {feedback && (
        <FeedbackBanner
          tone={feedback.tone}
          title={feedback.title}
          message={feedback.message}
          onDismiss={() => setFeedback(null)}
        />
      )}

      <section aria-label="Staff-controlled fallback" className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="m-0 text-[13px] font-semibold text-amber-950">
              Staff-controlled fallback
            </h2>
            <p className="m-0 mt-1 text-[11.5px] leading-5 text-amber-900">
              Joint planning is optional. Hospitals can review individual supplier candidates and banks independently confirm reservations.
            </p>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setManualFallback((current) => !current)}
            aria-expanded={manualFallback}
          >
            {manualFallback ? "Hide manual steps" : "Use individual workflow"}
          </Button>
        </div>
        {manualFallback && (
          <div className="space-y-3 border-t border-amber-200 pt-3" role="region" aria-label="Individual dispatch fallback instructions">
            {plannerFailure && (
              <p role="status" className="m-0 text-[12px] font-semibold text-amber-950">
                Joint proposal unavailable ({plannerFailure.replaceAll("_", " ").toLowerCase()}). No supplier has been automatically selected.
              </p>
            )}
            <ol className="m-0 list-decimal space-y-1.5 pl-5 text-[12px] leading-5 text-amber-950">
              <li>Coordinator contacts each requesting hospital; the hospital officer signs in to their own account and opens their request's candidate list.</li>
              <li>Hospital staff verify <strong>current</strong> full-quantity stock, blood-group eligibility, quarantine and recorded cold-chain evidence. They may reject every option or select an eligible provider.</li>
              <li>Supplying blood-bank staff independently accept or decline. Server-side rechecks and inventory locks remain mandatory; delivery and reservation changes are recorded by the existing workflow.</li>
            </ol>
            {selectedIds.length > 0 && (
              <div className="rounded-lg border border-amber-200 bg-white/70 p-3">
                <p className="m-0 mb-2 text-[11px] font-semibold text-amber-950">Request handoff (identifiers only; not confirmed allocations)</p>
                {selectedIds.map((id) => {
                  const request = requestsById.get(id);
                  return (
                    <p key={id} className="m-0 mt-1 break-all font-mono text-[10.5px] text-amber-950">
                      {request?.requester.name ?? "Hospital"} · {id} · {request?.unitsRequired ?? "?"} units
                    </p>
                  );
                })}
              </div>
            )}
            {connectionUnconfirmed ? (
              <p role="alert" className="m-0 rounded-lg border border-red-200 bg-red-50 p-3 text-[12px] leading-5 text-red-900">
                Connection unavailable: the displayed stock may be stale. Do not confirm a supplier, reservation or delivery from this screen. Use established telephone coordination and reconcile records after connectivity returns. This is not an offline digital dispatch mode.
              </p>
            ) : (
              <p className="m-0 text-[11.5px] leading-5 text-amber-900">
                This coordinator account cannot approve a hospital's selection or reserve stock. Each institution must sign in under its own role. Refresh live evidence before acting.
              </p>
            )}
            <Link href="/login" className="inline-flex min-h-9 items-center rounded-lg bg-amber-950 px-3 text-[12px] font-semibold text-white hover:bg-amber-900">
              Switch to hospital or blood-bank demo role
            </Link>
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div className="lg:col-span-5 space-y-5">
          <Panel className="space-y-4">
            <SectionHeader
              title="1. Select pending requests"
              description={`Choose ${MIN_DISPATCH_BATCH_SIZE} to ${MAX_DISPATCH_BATCH_SIZE} pending CRITICAL Red Cells requests (sorted oldest first).`}
              action={
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-brand-soft text-brand-dark border border-brand/20 whitespace-nowrap">
                  {selectedIds.length} / {MAX_DISPATCH_BATCH_SIZE} selected
                </span>
              }
            />

            <div className="flex flex-wrap items-center justify-between gap-2 pb-1">
              <span className="text-[11px] text-muted">
                {requests.length} pending eligible request{requests.length === 1 ? "" : "s"}
              </span>
              <div className="flex items-center gap-2">
                {requests.length >= MIN_DISPATCH_BATCH_SIZE && selectedIds.length === 0 && (
                  <button
                    type="button"
                    onClick={handleSelectTopPair}
                    className="text-[11px] font-semibold text-brand hover:underline"
                  >
                    Select oldest 2
                  </button>
                )}
                {selectedIds.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearSelection}
                    className="text-[11px] font-semibold text-muted hover:text-ink"
                  >
                    Clear selection
                  </button>
                )}
              </div>
            </div>

            {requests.length === 0 ? (
              <EmptyState
                title="No pending critical red-cell requests"
                description="Pending CRITICAL RED_CELLS requests from active hospitals appear here automatically."
              />
            ) : (
              <div className="space-y-2.5 max-h-[540px] overflow-y-auto pr-1">
                {requests.map((request) => {
                  const isSelected = selectedIds.includes(request.id);
                  const selectionDisabled =
                    !isSelected && selectedIds.length >= MAX_DISPATCH_BATCH_SIZE;

                  return (
                    <button
                      key={request.id}
                      type="button"
                      onClick={() => handleToggleRequest(request.id)}
                      aria-pressed={isSelected}
                      className={cn(
                        "w-full text-left rounded-2xl border p-3.5 transition-colors flex items-start gap-3",
                        isSelected
                          ? "border-brand bg-brand-soft/45"
                          : "border-border bg-white hover:bg-surface-muted",
                        selectionDisabled && "opacity-65",
                      )}
                    >
                      <span
                        className={cn(
                          "mt-0.5 shrink-0",
                          isSelected ? "text-brand" : "text-muted",
                        )}
                      >
                        {isSelected ? <CheckSquare size={17} /> : <Square size={17} />}
                      </span>

                      <BloodBadge group={request.bloodGroup} />

                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[13px] font-semibold text-ink truncate">
                            {request.requester.name}
                          </span>
                          <UrgencyBadge urgency={request.urgency} />
                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-muted">
                          <strong className="font-semibold text-ink">
                            {request.unitsRequired} units
                          </strong>
                          <span>Requested {formatPlannerDateTime(request.requestedAt)}</span>
                          {request.clinicalReference && (
                            <span className="font-mono text-[10.5px] px-1.5 py-0.5 rounded bg-surface-muted border border-border text-ink">
                              {request.clinicalReference}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </Panel>

          <Panel className="space-y-4">
            <SectionHeader
              title="2. Confirm inclusion & preview"
              description="Explicit staff approval is required before running joint solver checks. Previews never reserve inventory."
            />

            <label className="flex items-start gap-3 rounded-2xl border border-border bg-surface-muted/70 p-3.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={staffApproved}
                onChange={(event) => handleStaffApprovalChange(event.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-border accent-brand"
              />
              <span className="text-xs text-ink leading-relaxed">
                <strong className="font-semibold block">Staff approval confirmed</strong>
                I confirm approval to evaluate joint supplier options for the{" "}
                {selectedIds.length} selected request{selectedIds.length === 1 ? "" : "s"}.
              </span>
            </label>

            <Button
              type="button"
              onClick={() => void handlePreviewPlan()}
              disabled={!selectionReady || !staffApproved || isRefreshing}
              isLoading={isPreviewing}
              loadingText="Computing joint proposal…"
              className="w-full"
            >
              <Sparkles size={15} /> Preview dispatch plan
            </Button>

            {!selectionReady && (
              <p className="m-0 text-[11px] text-muted">
                Select between {MIN_DISPATCH_BATCH_SIZE} and {MAX_DISPATCH_BATCH_SIZE} requests
                above to enable batch planning.
              </p>
            )}
          </Panel>
        </div>

        <div className="lg:col-span-7 space-y-5">
          <Panel className="space-y-5">
            <SectionHeader
              title="3. Joint supplier proposal"
              description="All selected requests remain mandatory under shared dispatchable stock and verified 2°C–6°C cold-chain gates."
              action={
                plan && plan.proposals.length > 0 ? (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() =>
                      void copyToClipboard("batch", formatBatchHandoffText(plan, requestsById))
                    }
                  >
                    {copiedKey === "batch" ? <Check size={14} /> : <Copy size={14} />}
                    {copiedKey === "batch" ? "Batch copied" : "Copy full batch"}
                  </Button>
                ) : null
              }
            />

            {!plan ? (
              <EmptyState
                title="No active batch preview"
                description="Select 2 to 5 critical red-cell requests on the left, confirm staff approval, and run Preview dispatch plan."
              />
            ) : (
              <div className="space-y-5">
                {statusMeta && (
                  <FeedbackBanner
                    tone={statusMeta.tone}
                    title={`Status: ${statusMeta.label}`}
                    message={statusMeta.description}
                  />
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-border bg-surface-muted/60 p-4 space-y-1">
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-muted block">
                      Joint plan · Summed estimated journey hours
                    </span>
                    <div className="flex items-baseline gap-2">
                      <strong className="text-2xl font-bold text-ink tabular-nums">
                        {plan.totalEstimatedTransitHours !== null
                          ? `${plan.totalEstimatedTransitHours.toFixed(2)}h`
                          : "Unavailable"}
                      </strong>
                      {hoursSaved !== null && hoursSaved > 0 && (
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-success-soft text-emerald-800 border border-success/25">
                          {hoursSaved.toFixed(2)}h shorter total
                        </span>
                      )}
                    </div>
                    <p className="m-0 text-[11px] text-muted">
                      Generated {formatPlannerDateTime(plan.generatedAt)} · Search nodes:{" "}
                      {plan.visitedNodes}
                    </p>
                  </div>

                  {showBaselineComparison ? (
                    <div className="rounded-2xl border border-border bg-white p-4 space-y-1">
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-muted block">
                        Nearest eligible baseline · Summed estimated journey hours
                      </span>
                      <strong className="text-2xl font-bold text-ink tabular-nums block">
                        {plan.nearestEligibleBaseline.totalTransitHours?.toFixed(2)}h
                      </strong>
                      <p className="m-0 text-[11px] text-muted">
                        Sequential nearest-eligible baseline ({plan.nearestEligibleBaseline.status})
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-border bg-white p-4 space-y-1">
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-muted block">
                        Nearest eligible baseline
                      </span>
                      <strong className="text-sm font-semibold text-ink block pt-1">
                        {plan.nearestEligibleBaseline.status} (incomplete sequential fit)
                      </strong>
                      <p className="m-0 text-[11px] text-muted">
                        Summed comparison requires complete assignments in both plans.
                      </p>
                    </div>
                  )}
                </div>

                {plan.proposals.length > 0 && (
                  <div className="space-y-3">
                    {plan.proposals.map((proposal) => (
                      <ProposalCard
                        key={proposal.requestId}
                        proposal={proposal}
                        request={requestsById.get(proposal.requestId)}
                        copied={copiedKey === proposal.requestId}
                        onCopy={() =>
                          void copyToClipboard(
                            proposal.requestId,
                            formatProposalHandoffText(
                              proposal,
                              requestsById.get(proposal.requestId),
                            ),
                          )
                        }
                      />
                    ))}
                  </div>
                )}

                {plan.notes.length > 0 && (
                  <div className="rounded-2xl border border-border bg-surface-muted/70 p-4 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-semibold text-ink">
                      <ShieldCheck size={15} className="text-brand" />
                      Operational assumptions & solver notes
                    </div>
                    <ul className="m-0 pl-4 space-y-1.5 text-xs text-muted leading-relaxed">
                      {plan.notes.map((note, index) => (
                        <li key={index}>{note}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="rounded-2xl border border-brand/20 bg-brand-soft/35 p-4 space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-semibold text-ink">
                    <Truck size={15} className="text-brand" />
                    4. Hospital approval & bank reservation workflow
                  </div>
                  <p className="m-0 text-xs text-muted leading-relaxed">
                    Coordinator previews do not modify requests or lock stock. Hand off the
                    proposed supplier IDs below so each hospital confirms selection via{" "}
                    <code className="text-[11px] px-1 py-0.5 rounded bg-white border border-border">
                      POST /api/v1/blood-requests/{"{id}"}/select-provider
                    </code>{" "}
                    (sending{" "}
                    <code className="text-[11px] px-1 py-0.5 rounded bg-white border border-border">
                      providerOrganizationId
                    </code>
                    ) and each supplying bank confirms reservation via{" "}
                    <code className="text-[11px] px-1 py-0.5 rounded bg-white border border-border">
                      POST /api/v1/provider/requests/{"{id}"}/accept
                    </code>
                    .
                  </p>
                </div>
              </div>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}

function ProposalCard({
  proposal,
  request,
  copied,
  onCopy,
}: {
  proposal: BackendDispatchProposal;
  request?: BackendBloodRequest;
  copied: boolean;
  onCopy: () => void;
}) {
  const hospitalName = request?.requester.name ?? proposal.requesterOrganizationId;

  return (
    <div className="rounded-2xl border border-border bg-white p-4 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <BloodBadge group={proposal.offeredBloodGroup} />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <strong className="text-sm font-semibold text-ink">{proposal.providerName}</strong>
              {request?.clinicalReference && (
                <span className="font-mono text-[10.5px] px-1.5 py-0.5 rounded bg-surface-muted border border-border text-ink">
                  {request.clinicalReference}
                </span>
              )}
            </div>
            <p className="m-0 mt-0.5 text-xs text-muted">
              For <span className="font-medium text-ink">{hospitalName}</span> · Offered group:{" "}
              <strong className="font-semibold text-ink">
                {formatBloodGroup(proposal.offeredBloodGroup)}
              </strong>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ColdChainBadge verified tempCelsius={proposal.recordedFridgeTempCelsius} />
          <Button type="button" variant="secondary" size="sm" onClick={onCopy}>
            {copied ? <Check size={13} /> : <Copy size={13} />}
            {copied ? "Copied" : "Copy handoff"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-xl bg-surface-muted border border-border text-xs">
        <div>
          <span className="text-[10.5px] text-muted block">Requested qty</span>
          <strong className="text-sm font-bold text-ink">{proposal.unitsRequired} units</strong>
        </div>
        <div>
          <span className="text-[10.5px] text-muted block">Dispatchable stock</span>
          <strong className="text-sm font-bold text-ink">
            {proposal.dispatchableUnitsAtPlanning} units
          </strong>
        </div>
        <div>
          <span className="text-[10.5px] text-muted block">Remaining after batch</span>
          <strong className="text-sm font-bold text-ink">
            {proposal.unitsRemainingAfterWholePlan} units
          </strong>
        </div>
        <div>
          <span className="text-[10.5px] text-muted block">Estimated transit</span>
          <strong className="text-sm font-bold text-ink inline-flex items-center gap-1">
            <Clock size={12} className="text-brand" />
            {proposal.estimatedTransitHours.toFixed(2)}h
          </strong>
        </div>
      </div>

      <p className="m-0 text-xs text-ink leading-relaxed">{proposal.rationale}</p>

      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border text-[11px] text-muted">
        <span className="font-mono">
          providerOrganizationId: <span className="text-ink">{proposal.providerOrganizationId}</span>
        </span>
        <span>Stock updated {formatPlannerDateTime(proposal.inventoryUpdatedAt)}</span>
      </div>
    </div>
  );
}
