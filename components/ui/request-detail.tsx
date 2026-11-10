/** Shared request summary and lifecycle timeline used by hospital and provider views. */

import { Check, Clock3 } from "lucide-react";
import {
  BloodBadge,
  Panel,
  SectionHeader,
  StatusBadge,
  UrgencyBadge,
  cn,
} from "@/components/ui/core";
import { formatBloodGroup, formatComponent } from "@/lib/domain";
import type { BloodRequest } from "@/types/domain";

export function RequestHero({ request }: { request: BloodRequest }) {
  return (
    <Panel className="flex items-start justify-between gap-6 p-[23px]">
      <div>
        <div className="flex gap-[14px]">
          <BloodBadge group={request.bloodGroup} large />
          <div>
            <span className="m-0 mb-1.5 text-brand text-[11px] font-[720] tracking-[0.09em] uppercase block">
              {request.reference}
            </span>
            <h1 className="m-0 mt-[2px] mb-[7px] text-[21px] font-semibold">
              {formatBloodGroup(request.bloodGroup)} {formatComponent(request.component)}
            </h1>
            <p className="m-0 text-muted text-sm">{request.units} units requested</p>
          </div>
        </div>
        <div className="grid grid-cols-3 mt-5 pt-[18px] border-t border-border [&>div+div]:pl-[18px] [&>div+div]:border-l [&>div+div]:border-border [&_span]:block [&_span]:text-muted [&_span]:text-[10.5px] [&_strong]:block [&_strong]:mt-[5px] [&_strong]:text-base">
          <div>
            <span>Requested</span>
            <strong>{request.units} units</strong>
          </div>
          <div>
            <span>Reserved</span>
            <strong>{request.reservedUnits} units</strong>
          </div>
          <div>
            <span>Last update</span>
            <strong>{request.updatedAt}</strong>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap justify-end gap-[7px]">
        <UrgencyBadge urgency={request.urgency} />
        <StatusBadge status={request.status} />
      </div>
    </Panel>
  );
}

export function RequestTimeline({ request }: { request: BloodRequest }) {
  const lifecycleLabels = [
    "Request created",
    "Provider selected",
    "Accepted",
    "Preparing",
    "In transit",
    "Delivered",
  ];
  const terminal = ["DECLINED", "CANCELLED", "EXPIRED"].includes(request.status);
  const labels = terminal ? request.timeline.map((event) => event.label) : lifecycleLabels;

  return (
    <Panel>
      <SectionHeader
        title="Request lifecycle"
        description="Live fulfilment progress and event history"
      />
      <div className="grid gap-0">
        {labels.map((label) => {
          const event = request.timeline.find(
            (item) => item.label.toLowerCase() === label.toLowerCase(),
          );
          const reached = Boolean(event);
          return (
            <div
              className="min-h-[62px] grid grid-cols-[22px_1fr_auto] gap-[10px] relative [&:not(:last-child):before]:content-[''] [&:not(:last-child):before]:w-px [&:not(:last-child):before]:absolute [&:not(:last-child):before]:left-2 [&:not(:last-child):before]:top-[17px] [&:not(:last-child):before]:bottom-[-3px] [&:not(:last-child):before]:bg-border"
              key={label}
            >
              <span
                className={cn(
                  "w-[17px] h-[17px] grid place-items-center z-10 rounded-full box-border border-4",
                  reached
                    ? "text-[#fff] bg-success border-success-soft"
                    : "bg-border-strong border-surface-muted",
                )}
              >
                {reached && <Check size={9} />}
              </span>
              <div>
                <strong className="text-[11.5px] font-semibold">{label}</strong>
                <p className="m-0 mt-1 text-muted text-[10.5px]">
                  {event?.detail ?? (reached ? "Status confirmed" : "Awaiting update")}
                </p>
              </div>
              <time className="text-muted text-[10px]">
                {event?.timestamp ?? (reached ? "Confirmed" : "Pending")}
              </time>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

export function ProviderCard({ request }: { request: BloodRequest }) {
  const providerInitials = request.providerName
    ? request.providerName
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase()
    : "—";

  return (
    <Panel>
      <SectionHeader title="Provider" description="Selected fulfilment facility" />
      <div className="flex items-center gap-[10px] mb-[13px]">
        <span className="w-10 h-10 grid place-items-center rounded-[11px] text-[#fff] bg-ink text-[11px] font-bold">
          {providerInitials}
        </span>
        <div className="flex flex-col">
          <strong className="text-[12px]">{request.providerName ?? "Awaiting provider"}</strong>
          <span className="mt-1 text-muted text-[10.5px]">
            {request.providerName ? "Selected fulfilment facility" : "Matching in progress"}
          </span>
        </div>
      </div>
      <div className="grid gap-0 [&>div]:flex [&>div]:justify-between [&>div]:gap-5 [&>div]:py-3 [&>div]:border-b [&>div]:border-[#edf1ef] [&>div:last-child]:border-0 [&>div:last-child]:pb-0 [&_span]:text-muted [&_span]:text-[11px] [&_strong]:text-[11.5px] [&_strong]:text-right [&_strong]:inline-flex [&_strong]:items-center [&_strong]:justify-end [&_strong]:gap-[5px]">
        {request.distanceKm !== undefined && (
          <div>
            <span>Distance</span>
            <strong>{request.distanceKm} km</strong>
          </div>
        )}
        <div>
          <span>Selection status</span>
          <strong className={request.providerName ? "text-success" : "text-muted"}>
            <i className="w-[6px] h-[6px] rounded-full bg-current" />
            {request.providerName ? "Selected" : "Awaiting selection"}
          </strong>
        </div>
      </div>
    </Panel>
  );
}

export function MetadataCard({ request }: { request: BloodRequest }) {
  return (
    <Panel>
      <SectionHeader title="Request information" />
      <div className="grid gap-0 [&>div]:flex [&>div]:justify-between [&>div]:gap-5 [&>div]:py-3 [&>div]:border-b [&>div]:border-[#edf1ef] [&>div:last-child]:border-0 [&>div:last-child]:pb-0 [&_span]:text-muted [&_span]:text-[11px] [&_strong]:text-[11.5px] [&_strong]:text-right [&_strong]:inline-flex [&_strong]:items-center [&_strong]:justify-end [&_strong]:gap-[5px]">
        <div>
          <span>Clinical reference</span>
          <strong>{request.clinicalReference ?? "None recorded"}</strong>
        </div>
        {request.createdBy && (
          <div>
            <span>Created by</span>
            <strong>{request.createdBy}</strong>
          </div>
        )}
        <div>
          <span>Created</span>
          <strong>
            <Clock3 size={12} /> {request.createdAt}
          </strong>
        </div>
        <div>
          <span>Notes</span>
          <strong>{request.notes ?? "No operational notes"}</strong>
        </div>
      </div>
    </Panel>
  );
}
