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
    }, 600);
  }
  return (
    <>
      <PageHeader
        backHref="/blood-bank/requests"
        title={initial.reference}
        description="Inspect availability and manage this request through fulfilment."
      />
      {notice && (
        <div className="success-banner">
          <CheckCircle2 size={17} />
          <span>{notice}</span>
          <button onClick={() => setNotice("")} aria-label="Dismiss">
            <X size={15} />
          </button>
        </div>
      )}
      <div className="detail-grid">
        <div className="detail-stack">
          <RequestHero request={request} />
          <Panel>
            <SectionHeader
              title="Inventory check"
              description="Exact stock held at Maitama Blood Centre"
            />
            <div className="inventory-check">
              <div>
                <span>Available</span>
                <strong>8 units</strong>
              </div>
              <div>
                <span>Reserved</span>
                <strong>{request.reservedUnits} units</strong>
              </div>
              <div>
                <span>Free after acceptance</span>
                <strong>{8 - request.units} units</strong>
              </div>
              <span className="eligible-note">
                <CheckCircle2 size={15} /> Can fully fulfil
              </span>
            </div>
          </Panel>
          <RequestTimeline request={request} />
          <MetadataCard request={request} />
        </div>
        <aside>
          <Panel className="action-panel">
            <SectionHeader
              title="Request actions"
              description="Actions follow the fulfilment lifecycle"
            />
            <div className="current-status-row">
              <span>Current status</span>
              <StatusBadge status={status} />
            </div>
            {status === "REQUESTED" && (
              <Button variant="secondary" onClick={() => setConfirm("decline")}>
                <XCircle size={15} />
                Decline request
              </Button>
            )}
            {action && (
              <Button onClick={() => setConfirm("advance")}>
                <action.icon size={15} />
                {action.label}
                <ArrowRight size={14} />
              </Button>
            )}
            {status === "DELIVERED" && (
              <div className="terminal-state">
                <CheckCircle2 size={20} />
                <strong>Fulfilment complete</strong>
                <p>This request is read-only.</p>
              </div>
            )}
            {status === "DECLINED" && (
              <div className="terminal-state terminal-declined">
                <XCircle size={20} />
                <strong>Request declined</strong>
                <p>No inventory was reserved.</p>
              </div>
            )}
            <div className="action-note">
              <AlertTriangle size={14} />
              <p>
                Consequential status changes require confirmation and are recorded in the activity
                history.
              </p>
            </div>
          </Panel>
        </aside>
      </div>
      {confirm && (
        <div
          className="dialog-backdrop"
          role="presentation"
          onMouseDown={() => {
            if (!processing) setConfirm(null);
          }}
        >
          <div
            ref={dialogRef}
            className="dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="dialog-head">
              <span className="dialog-icon">
                {confirm === "decline" ? (
                  <XCircle size={19} />
                ) : (
                  action && <action.icon size={19} />
                )}
              </span>
              <button
                className="icon-button"
                onClick={() => setConfirm(null)}
                aria-label="Close"
                disabled={processing}
              >
                <X size={17} />
              </button>
            </div>
            <h2 id="confirm-title">
              {confirm === "decline"
                ? "Decline this request?"
                : `Confirm ${action?.label.toLowerCase()}`}
            </h2>
            <p>
              {confirm === "decline"
                ? "The hospital will be notified and HemoGrid can continue searching for another eligible provider."
                : "This updates the shared request timeline for the hospital and network operations team."}
            </p>
            <div className="dialog-actions">
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
    </>
  );
}
