"use client";

import { useCallback, useState } from "react";
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
import { Button, PageHeader, Panel, SectionHeader, StatusBadge } from "@/components/ui/core";
import { MetadataCard, RequestHero, RequestTimeline } from "@/components/ui/request-detail";
import { statusOrder } from "@/lib/domain";
import { useDialogFocus } from "@/lib/use-dialog-focus";
import type { BloodRequest, BloodRequestStatus } from "@/types/domain";

const transitions: Partial<
  Record<BloodRequestStatus, { label: string; next: BloodRequestStatus; icon: typeof Check }>
> = {
  REQUESTED: { label: "Accept request", next: "ACCEPTED", icon: CheckCircle2 },
  ACCEPTED: { label: "Begin preparation", next: "PREPARING", icon: PackageCheck },
  PREPARING: { label: "Mark in transit", next: "IN_TRANSIT", icon: Truck },
  IN_TRANSIT: { label: "Mark delivered", next: "DELIVERED", icon: Check },
};

export function ProviderRequestDetail({ initial }: { initial: BloodRequest }) {
  const [status, setStatus] = useState<BloodRequestStatus>(
    initial.id === "req-0138" ? "REQUESTED" : initial.status,
  );
  const [confirm, setConfirm] = useState<"advance" | "decline" | null>(null);
  const [notice, setNotice] = useState("");
  const [processing, setProcessing] = useState(false);

  const action = transitions[status];
  const request = {
    ...initial,
    status,
    reservedUnits: statusOrder.indexOf(status) >= 1 ? initial.units : 0,
    timeline: initial.timeline,
  };

  const closeDialog = useCallback(() => setConfirm(null), []);
  const dialogRef = useDialogFocus(Boolean(confirm), closeDialog);

  function complete() {
    setProcessing(true);
    window.setTimeout(() => {
      if (confirm === "decline") {
        setStatus("DECLINED");
        setNotice("Request declined. The hospital has been notified.");
      } else if (action) {
        setStatus(action.next);
        setNotice(`Request updated to ${action.next.replace("_", " ").toLowerCase()}.`);
      }
      setProcessing(false);
      setConfirm(null);
    }, 550);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        backHref="/blood-bank/requests"
        title={initial.reference}
        description="Inspect inventory availability and manage this request through the fulfilment lifecycle."
      />

      {notice && (
        <div className="p-4 rounded-2xl bg-success-soft border border-success/30 flex items-center justify-between gap-3 text-xs text-emerald-800">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-success shrink-0" />
            <span className="font-semibold">{notice}</span>
          </div>
          <button
            onClick={() => setNotice("")}
            aria-label="Dismiss notice"
            className="text-emerald-700 hover:text-emerald-900 transition-colors"
          >
            <X size={15} />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_0.9fr] gap-5 items-start">
        {/* Main Left Stack */}
        <div className="space-y-5">
          <RequestHero request={request} />

          <Panel className="p-6 space-y-4">
            <SectionHeader
              title="Inventory check"
              description="Exact stock held at Maitama Blood Centre"
            />
            <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-surface-muted border border-border text-center">
              <div>
                <span className="text-[11px] text-muted block">Available</span>
                <strong className="text-base font-bold text-ink">8 units</strong>
              </div>
              <div className="border-x border-border">
                <span className="text-[11px] text-muted block">Reserved</span>
                <strong className="text-base font-bold text-amber-700">{request.reservedUnits} units</strong>
              </div>
              <div>
                <span className="text-[11px] text-muted block">Free After Dispatch</span>
                <strong className="text-base font-bold text-emerald-700">
                  {8 - request.units} units
                </strong>
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-success-soft text-success border border-success/20">
              <CheckCircle2 size={14} /> Can fully fulfil this order
            </div>
          </Panel>

          <RequestTimeline request={request} />
          <MetadataCard request={request} />
        </div>

        {/* Aside Action Panel */}
        <aside>
          <Panel className="p-6 space-y-5 sticky top-24">
            <SectionHeader
              title="Request actions"
              description="Progress this transfer through verified operational states"
            />

            <div className="p-3.5 rounded-2xl bg-surface-muted border border-border flex items-center justify-between text-xs">
              <span className="font-medium text-muted">Current status:</span>
              <StatusBadge status={status} />
            </div>

            <div className="space-y-2.5">
              {status === "REQUESTED" && (
                <Button
                  variant="secondary"
                  onClick={() => setConfirm("decline")}
                  className="w-full flex items-center justify-center gap-2 text-xs"
                >
                  <XCircle size={15} />
                  Decline request
                </Button>
              )}

              {action && (
                <Button
                  onClick={() => setConfirm("advance")}
                  className="w-full flex items-center justify-center gap-2 text-xs font-semibold"
                >
                  <action.icon size={15} />
                  {action.label}
                  <ArrowRight size={14} />
                </Button>
              )}

              {status === "DELIVERED" && (
                <div className="p-4 rounded-2xl bg-success-soft/70 border border-success/30 text-center space-y-1">
                  <CheckCircle2 size={20} className="text-success mx-auto" />
                  <strong className="block text-xs font-bold text-emerald-800">Fulfilment Complete</strong>
                  <p className="text-[11px] text-emerald-700">This request is finalized and logged in audit history.</p>
                </div>
              )}

              {status === "DECLINED" && (
                <div className="p-4 rounded-2xl bg-critical-soft/70 border border-critical/30 text-center space-y-1">
                  <XCircle size={20} className="text-critical mx-auto" />
                  <strong className="block text-xs font-bold text-critical">Request Declined</strong>
                  <p className="text-[11px] text-critical/80">No inventory was locked or reserved.</p>
                </div>
              )}
            </div>

            <div className="p-3 rounded-xl bg-surface-muted border border-border flex items-start gap-2.5 text-[11px] text-muted">
              <AlertTriangle size={14} className="text-amber-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                Status changes are broadcast immediately across the network and recorded in the immutable audit log.
              </p>
            </div>
          </Panel>
        </aside>
      </div>

      {/* Confirmation Dialog */}
      {confirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150"
          role="presentation"
          onMouseDown={() => {
            if (!processing) setConfirm(null);
          }}
        >
          <div
            ref={dialogRef}
            className="w-full max-w-md bg-white border border-border rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-brand-soft border border-brand/20 grid place-items-center text-brand">
                {confirm === "decline" ? <XCircle size={20} className="text-critical" /> : <CheckCircle2 size={20} />}
              </div>
              <button
                type="button"
                className="w-8 h-8 rounded-full border border-border grid place-items-center text-muted hover:text-ink hover:bg-surface-muted transition-colors"
                onClick={() => setConfirm(null)}
                aria-label="Close"
                disabled={processing}
              >
                <X size={15} />
              </button>
            </div>

            <div>
              <h2 id="confirm-title" className="text-base font-bold text-ink">
                {confirm === "decline"
                  ? "Decline this emergency request?"
                  : `Confirm ${action?.label.toLowerCase()}`}
              </h2>
              <p className="text-xs text-muted mt-1 leading-relaxed">
                {confirm === "decline"
                  ? "The hospital will be immediately notified and HemoGrid will route the request to the next nearest eligible blood bank."
                  : "This updates the shared request timeline for the hospital trauma team and regional transport coordinators."}
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
              <Button variant="secondary" onClick={() => setConfirm(null)} disabled={processing}>
                Go back
              </Button>
              <Button
                variant={confirm === "decline" ? "danger" : "primary"}
                onClick={complete}
                isLoading={processing}
                loadingText={confirm === "decline" ? "Declining request…" : "Updating request…"}
              >
                Confirm action
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
