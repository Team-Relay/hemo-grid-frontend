/** Interactive provider detail UI backed exclusively by authenticated Server Actions. */

"use client";

import { useActionState, useCallback, useState } from "react";
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

import { mutateProviderRequestAction } from "@/app/actions/provider";
import { Button, PageHeader, Panel, SectionHeader, StatusBadge } from "@/components/ui/core";
import { MetadataCard, RequestHero, RequestTimeline } from "@/components/ui/request-detail";
import { initialProviderActionState } from "@/lib/requests/provider-action-state";
import { useDialogFocus } from "@/lib/use-dialog-focus";
import type { ProviderRequestIntent } from "@/lib/validation/provider";
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

export function ProviderRequestDetail({
  request,
  matchingInventory,
}: {
  request: BloodRequest;
  matchingInventory?: InventoryItem;
}) {
  const [confirm, setConfirm] = useState<ProviderRequestIntent | null>(null);
  const [dismissedCompletion, setDismissedCompletion] = useState<number>();
  const [state, formAction, isPending] = useActionState(
    mutateProviderRequestAction,
    initialProviderActionState,
  );
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

  return (
    <div className="space-y-6">
      <PageHeader
        backHref="/blood-bank/requests"
        title={request.reference}
        description="Inspect live inventory and manage this request through the fulfilment lifecycle."
      />

      {successVisible && (
        <div
          className="p-4 rounded-2xl bg-success-soft border border-success/30 flex items-center justify-between gap-3 text-xs text-emerald-800"
          role="status"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-success shrink-0" />
            <span className="font-semibold">{state.successMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setDismissedCompletion(state.completedAt)}
            aria-label="Dismiss notice"
            className="text-emerald-700 hover:text-emerald-900 transition-colors"
          >
            <X size={15} />
          </button>
        </div>
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
                Each change is verified against request ownership, current status, and available
                inventory. Hospital teams receive updates automatically.
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
            action={formAction}
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
              <p
                className="rounded-xl border border-success/25 bg-success-soft px-3 py-2 text-[11px] text-emerald-800"
                role="status"
              >
                {state.successMessage}
              </p>
            )}

            {dialogResultApplies && state.message && (
              <p
                className="rounded-xl border border-critical/25 bg-critical-soft px-3 py-2 text-[11px] text-critical"
                role="alert"
              >
                {state.message}
              </p>
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
        <p className="rounded-2xl border border-critical/25 bg-critical-soft p-4 text-xs text-critical">
          This bank has no matching inventory record for the requested blood group and component, so
          the request cannot be accepted.
        </p>
      </Panel>
    );
  }

  const free = inventory.availableUnits - inventory.reservedUnits;
  const canFulfil = request.status === "REQUESTED" ? free >= request.units : true;

  return (
    <Panel className="p-6 space-y-4">
      <SectionHeader title="Inventory check" description="Live exact-group stock at this bank" />
      <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-surface-muted border border-border text-center">
        <div>
          <span className="text-[11px] text-muted block">Available</span>
          <strong className="text-base font-bold text-ink">{inventory.availableUnits} units</strong>
        </div>
        <div className="border-x border-border">
          <span className="text-[11px] text-muted block">Reserved</span>
          <strong className="text-base font-bold text-amber-700">
            {inventory.reservedUnits} units
          </strong>
        </div>
        <div>
          <span className="text-[11px] text-muted block">Free now</span>
          <strong className="text-base font-bold text-emerald-700">{free} units</strong>
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
