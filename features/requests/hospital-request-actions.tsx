"use client";

import { useActionState, useCallback, useState } from "react";
import { CheckCircle2, Clock3, X, XCircle } from "lucide-react";

import { cancelRequestAction } from "@/app/actions/blood-requests";
import { Button, Panel, SectionHeader, StatusBadge } from "@/components/ui/core";
import { initialRequestMutationState } from "@/lib/requests/action-state";
import { useDialogFocus } from "@/lib/use-dialog-focus";
import type { BloodRequest, BloodRequestStatus } from "@/types/domain";

const terminalStatuses: readonly BloodRequestStatus[] = [
  "DELIVERED",
  "DECLINED",
  "CANCELLED",
  "EXPIRED",
];
const cancellableStatuses: readonly BloodRequestStatus[] = ["REQUESTED", "ACCEPTED", "PREPARING"];

export function HospitalRequestActions({ request }: { request: BloodRequest }) {
  const [confirming, setConfirming] = useState(false);
  const [state, formAction, isPending] = useActionState(
    cancelRequestAction,
    initialRequestMutationState,
  );
  const closeDialog = useCallback(() => setConfirming(false), []);
  const dialogRef = useDialogFocus<HTMLFormElement>(confirming, closeDialog);
  const terminal = terminalStatuses.includes(request.status);
  const canCancel = cancellableStatuses.includes(request.status);
  const Icon = terminal && request.status !== "DELIVERED" ? XCircle : CheckCircle2;

  return (
    <>
      <Panel className="sticky top-[92px]">
        <SectionHeader title="Fulfilment status" />

        <div className="flex gap-[10px]">
          <Icon size={18} />
          <div>
            <strong>{statusTitle(request)}</strong>
            <p>{statusDescription(request)}</p>
          </div>
        </div>

        {canCancel && (
          <Button variant="danger" onClick={() => setConfirming(true)} className="w-full mt-2">
            <XCircle size={15} /> Cancel request
          </Button>
        )}

        <div className="grid gap-0 mt-4 [&>div]:flex [&>div]:justify-between [&>div]:gap-5 [&>div]:py-3 [&>div]:border-b [&>div]:border-[#edf1ef] [&>div:last-child]:border-0 [&>div:last-child]:pb-0 [&_span]:text-muted [&_span]:text-[11px] [&_strong]:text-[11.5px] [&_strong]:text-right [&_strong]:inline-flex [&_strong]:items-center [&_strong]:justify-end [&_strong]:gap-[5px]">
          <div>
            <span>Current status</span>
            <StatusBadge status={request.status} />
          </div>
          <div>
            <span>Reserved units</span>
            <strong>{request.reservedUnits}</strong>
          </div>
          <div>
            <span>Last checked</span>
            <strong>
              <Clock3 size={12} /> {request.updatedAt}
            </strong>
          </div>
        </div>
      </Panel>

      {confirming && (
        <div
          className="fixed inset-0 z-[100] grid place-items-center p-5 bg-[rgba(19,28,26,0.44)] backdrop-blur-[3px]"
          role="presentation"
          onMouseDown={() => {
            if (!isPending) closeDialog();
          }}
        >
          <form
            action={formAction}
            ref={dialogRef}
            className="w-[min(440px,100%)] p-[22px] border border-border rounded-[18px] bg-white shadow-[0_20px_60px_rgba(23,32,30,0.18)]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cancel-request-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <input type="hidden" name="requestId" value={request.id} />
            <div className="flex justify-between gap-4">
              <span className="w-10 h-10 grid place-items-center rounded-xl text-critical bg-critical-soft">
                <XCircle size={19} />
              </span>
              <button
                type="button"
                className="w-10 h-10 grid place-items-center rounded-full text-muted bg-surface hover:text-ink hover:bg-surface-muted transition-colors"
                onClick={closeDialog}
                aria-label="Close"
                disabled={isPending}
              >
                <X size={17} />
              </button>
            </div>
            <h2
              id="cancel-request-title"
              className="m-0 mt-[14px] mb-[6px] text-[17px] font-semibold"
            >
              Cancel this request?
            </h2>
            <p className="m-0 text-muted text-xs leading-[1.55]">
              The request will close immediately. Any selected provider will be notified and
              reserved inventory will be released by the backend.
            </p>

            {state.message && (
              <p
                className="mt-3 rounded-xl border border-critical/25 bg-critical-soft px-3 py-2 text-[11px] text-critical"
                role="alert"
              >
                {state.message}
              </p>
            )}

            <div className="flex justify-end gap-2 mt-5">
              <Button type="button" variant="secondary" onClick={closeDialog} disabled={isPending}>
                Keep request
              </Button>
              <Button
                type="submit"
                variant="danger"
                isLoading={isPending}
                loadingText="Cancelling request…"
              >
                Cancel request
              </Button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

function statusTitle(request: BloodRequest): string {
  switch (request.status) {
    case "DELIVERED":
      return "Request delivered";
    case "DECLINED":
      return "Provider declined";
    case "CANCELLED":
      return "Request cancelled";
    case "EXPIRED":
      return "Request expired";
    case "IN_TRANSIT":
      return "Transfer in transit";
    case "PREPARING":
      return "Provider preparing units";
    case "ACCEPTED":
      return "Provider accepted";
    default:
      return request.providerName ? "Awaiting provider response" : "Searching network";
  }
}

function statusDescription(request: BloodRequest): string {
  switch (request.status) {
    case "DELIVERED":
      return "The provider marked this transfer as delivered.";
    case "DECLINED":
      return "No inventory was reserved for this declined request.";
    case "CANCELLED":
      return "The request is closed and reserved inventory has been released.";
    case "EXPIRED":
      return "The request closed before fulfilment was completed.";
    case "IN_TRANSIT":
      return `${request.reservedUnits} units are on their way from ${request.providerName ?? "the provider"}.`;
    case "PREPARING":
      return `${request.providerName ?? "The provider"} is preparing ${request.reservedUnits} reserved units.`;
    case "ACCEPTED":
      return `${request.reservedUnits} units are reserved by ${request.providerName ?? "the selected provider"}.`;
    default:
      return request.providerName
        ? `${request.providerName} has been selected and has not responded yet.`
        : "Eligible facilities are being evaluated for this request.";
  }
}
