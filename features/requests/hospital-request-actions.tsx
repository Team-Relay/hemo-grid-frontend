"use client";

import { CheckCircle2, X, XCircle } from "lucide-react";
import { useCallback, useState } from "react";

import { Button, Panel, SectionHeader, StatusBadge } from "@/components/ui/core";
import { useDialogFocus } from "@/lib/use-dialog-focus";
import type { BloodRequest } from "@/types/domain";

export function HospitalRequestActions({ request }: { request: BloodRequest }) {
  const [cancelled, setCancelled] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const closeDialog = useCallback(() => setConfirming(false), []);
  const dialogRef = useDialogFocus(confirming, closeDialog);
  const status = cancelled ? "CANCELLED" : request.status;

  return (
    <>
      <Panel className="sticky top-[92px]">
        <SectionHeader title="Fulfilment status" />

        <div className="flex gap-[10px]">
          {cancelled ? <XCircle size={18} /> : <CheckCircle2 size={18} />}
          <div>
            <strong>
              {cancelled
                ? "Request cancelled"
                : request.providerName
                  ? "Provider accepted"
                  : "Searching network"}
            </strong>
            <p>
              {cancelled
                ? "The request is closed and no further provider action is available."
                : request.providerName
                  ? `${request.reservedUnits} units are reserved for this request.`
                  : "Eligible facilities are being contacted."}
            </p>
          </div>
        </div>

        {status === "REQUESTED" && (
          <Button variant="danger" onClick={() => setConfirming(true)} className="w-full mt-2">
            <XCircle size={15} /> Cancel request
          </Button>
        )}

        <div className="grid gap-0 mt-4 [&>div]:flex [&>div]:justify-between [&>div]:gap-5 [&>div]:py-3 [&>div]:border-b [&>div]:border-[#edf1ef] [&>div:last-child]:border-0 [&>div:last-child]:pb-0 [&_span]:text-muted [&_span]:text-[11px] [&_strong]:text-[11.5px] [&_strong]:text-right [&_strong]:inline-flex [&_strong]:items-center [&_strong]:justify-end [&_strong]:gap-[5px]">
          <div>
            <span>Current status</span>
            <StatusBadge status={status} />
          </div>
          <div>
            <span>Estimated handover</span>
            <strong>{cancelled ? "Not applicable" : "~28 minutes"}</strong>
          </div>
          <div>
            <span>Last checked</span>
            <strong>Just now</strong>
          </div>
        </div>
      </Panel>

      {confirming && (
        <div
          className="fixed inset-0 z-[100] grid place-items-center p-5 bg-[rgba(19,28,26,0.44)] backdrop-blur-[3px]"
          role="presentation"
          onMouseDown={() => {
            if (!cancelling) closeDialog();
          }}
        >
          <div
            ref={dialogRef}
            className="w-[min(440px,100%)] p-[22px] border border-border rounded-[18px] bg-white shadow-[0_20px_60px_rgba(23,32,30,0.18)]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cancel-request-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="flex justify-between gap-4">
              <span className="w-10 h-10 grid place-items-center rounded-xl text-critical bg-critical-soft">
                <XCircle size={19} />
              </span>
              <button
                type="button"
                className="w-10 h-10 grid place-items-center rounded-full text-muted bg-surface hover:text-ink hover:bg-surface-muted transition-colors"
                onClick={closeDialog}
                aria-label="Close"
                disabled={cancelling}
              >
                <X size={17} />
              </button>
            </div>
            <h2 id="cancel-request-title" className="m-0 mt-[14px] mb-[6px] text-[17px] font-semibold">Cancel this request?</h2>
            <p className="m-0 text-muted text-xs leading-[1.55]">
              The request will close immediately. Any selected provider will be notified and
              reserved inventory will be released.
            </p>
            <div className="flex justify-end gap-2 mt-5">
              <Button variant="secondary" onClick={closeDialog} disabled={cancelling}>
                Keep request
              </Button>
              <Button
                variant="danger"
                isLoading={cancelling}
                loadingText="Cancelling request…"
                onClick={() => {
                  setCancelling(true);
                  window.setTimeout(() => {
                    setCancelled(true);
                    setCancelling(false);
                    setConfirming(false);
                  }, 600);
                }}
              >
                Cancel request
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
