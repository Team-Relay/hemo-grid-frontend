/** Interactive provider detail UI backed directly by Spring Boot provider endpoints. */

"use client";

import { useCallback, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  PackageCheck,
  Truck,
  X,
  XCircle,
} from "lucide-react";

import { revalidateProviderDataAction } from "@/app/actions/provider";
import {
  Button,
  ColdChainBadge,
  FeedbackBanner,
  PageHeader,
  Panel,
  SectionHeader,
  StatusBadge,
} from "@/components/ui/core";
import { MetadataCard, RequestHero, RequestTimeline } from "@/components/ui/request-detail";
import { ApiClientError } from "@/lib/api/errors";
import {
  acceptProviderRequest,
  declineProviderRequest,
  updateProviderRequestStatus,
} from "@/lib/api/provider-requests";
import { clearClientSessionCookie, getClientAccessToken } from "@/lib/auth/client-session";
import {
  initialProviderActionState,
  type ProviderActionState,
} from "@/lib/requests/provider-action-state";
import { useDialogFocus } from "@/lib/use-dialog-focus";
import {
  providerRequestMutationSchema,
  type ProviderRequestIntent,
} from "@/lib/validation/provider";
import type { BloodRequest, InventoryItem } from "@/types/domain";

const transitions: Partial<
  Record<
    BloodRequest["status"],
    { label: string; intent: ProviderRequestIntent; icon: typeof Check }
  >
> = {
  REQUESTED: { label: "Accept request", intent: "ACCEPT", icon: CheckCircle2 },
  ACCEPTED: { label: "Begin preparation", intent: "PREPARING", icon: PackageCheck },
  PREPARING: { label: "Mark in transit", intent: "IN_TRANSIT", icon: Truck },
  IN_TRANSIT: { label: "Mark delivered", intent: "DELIVERED", icon: Check },
};

function providerSuccessMessage(intent: ProviderRequestIntent): string {
  const messages: Record<ProviderRequestIntent, string> = {
    ACCEPT: "Request accepted and inventory reserved.",
    DECLINE: "Request declined. No inventory was reserved.",
    PREPARING: "Request marked as preparing.",
    IN_TRANSIT: "Request marked as in transit.",
    DELIVERED: "Delivery confirmed and reserved inventory consumed.",
  };
  return messages[intent];
}

export function ProviderRequestDetail({
  request,
  matchingInventory,
}: {
  request: BloodRequest;
  matchingInventory?: InventoryItem;
}) {
  const router = useRouter();
  const [confirm, setConfirm] = useState<ProviderRequestIntent | null>(null);
  const [dismissedCompletion, setDismissedCompletion] = useState<number>();
  const [state, setState] = useState<ProviderActionState>(initialProviderActionState);
  const [isPending, setIsPending] = useState(false);
  const closeDialog = useCallback(() => setConfirm(null), []);
  const dialogRef = useDialogFocus<HTMLFormElement>(Boolean(confirm), closeDialog);
  const transition = transitions[request.status];
  const successVisible = state.successMessage && state.completedAt !== dismissedCompletion;
  const dialogResultApplies = Boolean(
    state.completedAt && state.completedAt !== dismissedCompletion,
  );

  function openConfirmation(intent: ProviderRequestIntent) {
    // A result from the previous dialog must not leak into a new action.
    setDismissedCompletion(state.completedAt);
    setConfirm(intent);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isPending || !confirm) return;

    const validated = providerRequestMutationSchema.safeParse({
      requestId: request.id,
      intent: confirm,
    });
    if (!validated.success) {
      setState({
        message: "The request action is invalid. Refresh the page and try again.",
        completedAt: Date.now(),
      });
      return;
    }

    const accessToken = getClientAccessToken();
    if (!accessToken) {
      router.replace("/login?reason=session-expired");
      return;
    }

    setIsPending(true);

    try {
      const { requestId, intent } = validated.data;
      if (intent === "ACCEPT") await acceptProviderRequest(accessToken, requestId);
      else if (intent === "DECLINE") await declineProviderRequest(accessToken, requestId);
      else await updateProviderRequestStatus(accessToken, requestId, intent);

      await revalidateProviderDataAction(requestId);
      setIsPending(false);
      setState({
        successMessage: providerSuccessMessage(intent),
        completedAt: Date.now(),
      });
      closeDialog();
      router.refresh();
    } catch (error) {
      setIsPending(false);
      if (error instanceof ApiClientError) {
        if (error.status === 401) {
          clearClientSessionCookie();
          router.replace("/login?reason=session-expired");
          return;
        }
        if (error.status === 403) {
          setState({
            message: "Your account cannot perform this blood-bank action.",
            completedAt: Date.now(),
          });
          return;
        }
        if (error.status === 404) {
          setState({
            message: "This request or inventory row is no longer available.",
            completedAt: Date.now(),
          });
          return;
        }
        if (
          error.status === 409 ||
          error.code === "COLD_CHAIN_HOLD" ||
          error.code === "INSUFFICIENT_INVENTORY" ||
          error.code === "INVALID_REQUEST_STATUS"
        ) {
          setState({
            message:
              error.code === "COLD_CHAIN_HOLD"
                ? `${error.message} Live cold-chain status has been refreshed.`
                : error.message,
            completedAt: Date.now(),
          });
          router.refresh();
          return;
        }
        setState({ message: error.message, completedAt: Date.now() });
        return;
      }

      setState({
        message: "HemoGrid could not reach the server. Check your connection and try again.",
        completedAt: Date.now(),
      });
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        backHref="/blood-bank/requests"
        title={request.reference}
        description="Inspect live inventory, cold-chain compliance, and manage this request through the fulfilment lifecycle."
      />

      {successVisible && state.successMessage && (
        <FeedbackBanner
          tone="success"
          message={state.successMessage}
          onDismiss={() => setDismissedCompletion(state.completedAt)}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_0.9fr] gap-5 items-start">
        <div className="space-y-5">
          <RequestHero request={request} />
          <InventoryCheck request={request} inventory={matchingInventory} />
          <RequestTimeline request={request} />
          <MetadataCard request={request} />
        </div>

        <aside>
          <Panel className="p-6 space-y-5 sticky top-24">
            <SectionHeader
              title="Request actions"
              description="Progress this transfer through its verified fulfilment stages"
            />

            <div className="p-3.5 rounded-2xl bg-surface-muted border border-border flex items-center justify-between text-xs">
              <span className="font-medium text-muted">Current status:</span>
              <StatusBadge status={request.status} />
            </div>

            <div className="space-y-2.5">
              {request.status === "REQUESTED" && (
                <Button
                  variant="secondary"
                  onClick={() => openConfirmation("DECLINE")}
                  className="w-full flex items-center justify-center gap-2 text-xs"
                >
                  <XCircle size={15} /> Decline request
                </Button>
              )}

              {transition && (
                <Button
                  onClick={() => openConfirmation(transition.intent)}
                  className="w-full flex items-center justify-center gap-2 text-xs font-semibold"
                >
                  <transition.icon size={15} />
                  {transition.label}
                  <ArrowRight size={14} />
                </Button>
              )}

              <TerminalStatus status={request.status} />
            </div>

            <div className="p-3 rounded-xl bg-surface-muted border border-border flex items-start gap-2.5 text-[11px] text-muted">
              <AlertTriangle size={14} className="text-amber-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                Each change is verified against request ownership, current status, and cold-chain
                verified available inventory. Hospital teams receive updates automatically.
              </p>
            </div>
          </Panel>
        </aside>
      </div>

      {confirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150"
          role="presentation"
          onMouseDown={() => {
            if (!isPending) closeDialog();
          }}
        >
          <form
            onSubmit={handleSubmit}
            ref={dialogRef}
            className="w-full max-w-md bg-white border border-border rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5"
            role="dialog"
            aria-modal="true"
            aria-labelledby="provider-confirm-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <input type="hidden" name="requestId" value={request.id} />
            <input type="hidden" name="intent" value={confirm} />

            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-brand-soft border border-brand/20 grid place-items-center text-brand">
                {confirm === "DECLINE" ? (
                  <XCircle size={20} className="text-critical" />
                ) : (
                  <CheckCircle2 size={20} />
                )}
              </div>
              <button
                type="button"
                className="w-8 h-8 rounded-full border border-border grid place-items-center text-muted hover:text-ink hover:bg-surface-muted transition-colors"
                onClick={closeDialog}
                aria-label="Close"
                disabled={isPending}
              >
                <X size={15} />
              </button>
            </div>

            <div>
              <h2 id="provider-confirm-title" className="text-base font-bold text-ink">
                {confirmationTitle(confirm)}
              </h2>
              <p className="text-xs text-muted mt-1 leading-relaxed">
                {confirmationDescription(confirm)}
              </p>
            </div>

            {dialogResultApplies && state.successMessage && (
              <FeedbackBanner tone="success" message={state.successMessage} />
            )}

            {dialogResultApplies && state.message && (
              <FeedbackBanner tone="critical" message={state.message} />
            )}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
              {dialogResultApplies && state.successMessage ? (
                <Button type="button" onClick={closeDialog}>
                  Done
                </Button>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={closeDialog}
                    disabled={isPending}
                  >
                    Go back
                  </Button>
                  <Button
                    type="submit"
                    variant={confirm === "DECLINE" ? "danger" : "primary"}
                    isLoading={isPending}
                    loadingText={confirm === "DECLINE" ? "Declining request…" : "Updating request…"}
                  >
                    Confirm action
                  </Button>
                </>
              )}
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function InventoryCheck({
  request,
  inventory,
}: {
  request: BloodRequest;
  inventory?: InventoryItem;
}) {
  if (!inventory) {
    return (
      <Panel className="p-6 space-y-3">
        <SectionHeader title="Inventory check" description="Exact matching stock at this bank" />
        <FeedbackBanner
          tone="critical"
          message="This bank has no matching inventory record for the requested blood group and component, so the request cannot be accepted."
        />
      </Panel>
    );
  }

  const free = inventory.availableUnits - inventory.reservedUnits;
  const quarantined = inventory.quarantinedTempExcursionUnits ?? 0;
  const canFulfil = request.status === "REQUESTED" ? free >= request.units : true;

  return (
    <Panel className="p-6 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <SectionHeader
          title="Inventory & cold-chain check"
          description="Live exact-group stock and fridge excursion quarantine status"
        />
        <ColdChainBadge
          verified={inventory.coldChainStatus !== "EXCURSION_QUARANTINED"}
          tempCelsius={inventory.fridgeTempCelsius}
          quarantinedUnits={quarantined}
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-surface-muted border border-border text-center">
        <div>
          <span className="text-[11px] text-muted block">Available</span>
          <strong className="text-base font-bold text-ink">{inventory.availableUnits} units</strong>
        </div>
        <div className="sm:border-l border-border">
          <span className="text-[11px] text-muted block">Reserved</span>
          <strong className="text-base font-bold text-amber-700">
            {inventory.reservedUnits} units
          </strong>
        </div>
        <div className="sm:border-l border-border">
          <span className="text-[11px] text-muted block">Free now</span>
          <strong className="text-base font-bold text-emerald-700">{free} units</strong>
        </div>
        <div className="sm:border-l border-border">
          <span className="text-[11px] text-muted block">Quarantined (&gt;6°C)</span>
          <strong className="text-base font-bold text-slate-700">{quarantined} units</strong>
        </div>
      </div>

      <div
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
          canFulfil
            ? "bg-success-soft text-success border-success/20"
            : "bg-critical-soft text-critical border-critical/20"
        }`}
      >
        {canFulfil ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
        {canFulfil ? "Can fully fulfil this request" : "Insufficient free inventory"}
      </div>
    </Panel>
  );
}

function TerminalStatus({ status }: { status: BloodRequest["status"] }) {
  if (status === "DELIVERED") {
    return (
      <div className="p-4 rounded-2xl bg-success-soft/70 border border-success/30 text-center space-y-1">
        <CheckCircle2 size={20} className="text-success mx-auto" />
        <strong className="block text-xs font-bold text-emerald-800">Fulfilment complete</strong>
        <p className="text-[11px] text-emerald-700">
          Delivery and inventory consumption are finalized.
        </p>
      </div>
    );
  }
  if (["DECLINED", "CANCELLED", "EXPIRED"].includes(status)) {
    return (
      <div className="p-4 rounded-2xl bg-critical-soft/70 border border-critical/30 text-center space-y-1">
        <XCircle size={20} className="text-critical mx-auto" />
        <strong className="block text-xs font-bold text-critical">Request closed</strong>
        <p className="text-[11px] text-critical/80">No further provider actions are permitted.</p>
      </div>
    );
  }
  return null;
}

function confirmationTitle(intent: ProviderRequestIntent): string {
  if (intent === "DECLINE") return "Decline this request?";
  if (intent === "ACCEPT") return "Accept and reserve inventory?";
  return `Confirm ${intent.toLowerCase().replaceAll("_", " ")}`;
}

function confirmationDescription(intent: ProviderRequestIntent): string {
  if (intent === "DECLINE") {
    return "The request will close for this provider. No inventory will be reserved.";
  }
  if (intent === "ACCEPT") {
    return "The requested units will be reserved immediately for this transfer.";
  }
  if (intent === "DELIVERED") {
    return "Delivery confirmation permanently consumes the reserved units from available stock.";
  }
  return "The hospital will see this lifecycle change on its next background refresh.";
}
