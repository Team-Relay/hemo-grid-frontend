import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Clock3,
  FileClock,
  PackageCheck,
  Route,
  TimerReset,
} from "lucide-react";

import { NetworkMap } from "@/components/network/network-map";
import {
  BloodBadge,
  ButtonLink,
  EmptyState,
  Panel,
  SectionHeader,
  StatCard,
  StatusBadge,
  UrgencyBadge,
  cn,
} from "@/components/ui/core";
import { formatBloodGroup, formatComponent } from "@/lib/domain";
import { getHospitalDashboardData } from "@/lib/data/hospital";
import { isTodayInLagos } from "@/lib/api/mappers";
import type { BloodRequest, BloodRequestStatus } from "@/types/domain";

const activeStatuses: readonly BloodRequestStatus[] = [
  "REQUESTED",
  "ACCEPTED",
  "PREPARING",
  "IN_TRANSIT",
];

export default async function HospitalDashboard() {
  const { organization, requests } = await getHospitalDashboardData();
  const activeRequests = requests.filter((request) => activeStatuses.includes(request.status));
  const criticalActive = activeRequests.filter((request) => request.urgency === "CRITICAL").length;
  const awaitingResponse = requests.filter((request) => request.status === "REQUESTED").length;
  const inTransit = requests.filter((request) => request.status === "IN_TRANSIT").length;
  const completedToday = requests.filter(
    (request) => request.status === "DELIVERED" && isTodayInLagos(request.deliveredAt ?? null),
  ).length;
  const attentionRequests = requests.filter(needsAttention).slice(0, 3);

  return (
    <>
      <div className="grid grid-cols-[minmax(0,1.08fr)_minmax(430px,0.92fr)] items-stretch gap-4">
        <div className="flex flex-col gap-[14px] min-w-0">
          <Panel className="min-h-[120px] flex items-start justify-between gap-5 p-[23px] px-6">
            <div>
              <h1 className="m-0 mb-[9px] text-[21px] tracking-[-0.03em]">{organization.name}</h1>
              <div className="flex items-center gap-[10px] text-muted text-xs">
                <span className="w-7 h-7 grid place-items-center rounded-full bg-surface-muted text-ink">
                  <Clock3 size={14} />
                </span>
                <div>
                  <small>Last synchronized</small>
                  <br />
                  <strong>Just now</strong>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 text-muted text-[11px]">
              <span>System status</span>
              <strong
                className={cn(
                  "inline-flex items-center gap-[7px] px-[10px] py-[7px] rounded-full text-[11px] font-bold",
                  organization.active
                    ? "bg-success-soft text-success"
                    : "bg-critical-soft text-critical",
                )}
              >
                <i className="w-[6px] h-[6px] rounded-full bg-current shadow-[0_0_0_4px_color-mix(in_srgb,currentColor_12%,transparent)]" />
                {organization.active ? "Connected" : "Inactive"}
              </strong>
            </div>
          </Panel>

          <div className="grid grid-cols-4 gap-3">
            <StatCard
              label="Active requests"
              value={activeRequests.length}
              detail={`${criticalActive} critical`}
              icon={FileClock}
            />
            <StatCard
              label="Awaiting response"
              value={awaitingResponse}
              detail="awaiting provider"
              icon={TimerReset}
              tone="warning"
            />
            <StatCard label="In transit" value={inTransit} detail="active transfers" icon={Route} />
            <StatCard
              label="Completed today"
              value={completedToday}
              detail="delivered today"
              icon={PackageCheck}
              tone="success"
            />
          </div>

          <Panel className="p-[18px]">
            <SectionHeader
              title="Requires attention"
              description="Operational exceptions across your active requests"
              action={
                <Link
                  href="/hospital/requests"
                  className="inline-flex items-center gap-[5px] text-brand text-[11px] font-[650]"
                >
                  View requests <ArrowRight size={13} />
                </Link>
              }
            />
            {attentionRequests.length > 0 ? (
              <div className="grid gap-2">
                {attentionRequests.map((request) => (
                  <AttentionRequest key={request.id} request={request} />
                ))}
              </div>
            ) : (
              <EmptyState
                title="No requests need attention"
                description="Critical, awaiting-response, and in-transit requests will appear here."
              />
            )}
          </Panel>
        </div>

        {/* The map stays on its existing local dataset until a network endpoint is available. */}
        <NetworkMap />
      </div>

      <Panel className="col-span-full mt-4 p-[18px]">
        <SectionHeader
          title="Recent requests"
          description={`Latest activity from ${organization.name}`}
          action={
            <ButtonLink href="/hospital/requests/new" variant="secondary">
              New request
            </ButtonLink>
          }
        />
        {requests.length > 0 ? (
          <div className="grid grid-cols-4 gap-[10px]">
            {requests.slice(0, 4).map((request) => (
              <Link
                href={`/hospital/requests/${request.id}`}
                key={request.id}
                className="min-w-0 min-h-[154px] flex flex-col p-[15px] border border-border rounded-[13px] bg-surface transition-transform duration-150 ease-in-out overflow-hidden hover:border-border-strong hover:-translate-y-[1px]"
              >
                <div className="flex items-center justify-between gap-2">
                  <strong className="text-[11.5px] overflow-hidden text-ellipsis whitespace-nowrap">
                    {request.reference}
                  </strong>
                  <UrgencyBadge urgency={request.urgency} />
                </div>
                <div className="flex items-center gap-[9px] flex-1 my-[14px]">
                  <BloodBadge group={request.bloodGroup} />
                  <div className="min-w-0">
                    <strong className="block text-[12px] overflow-hidden text-ellipsis whitespace-nowrap">
                      {formatComponent(request.component)} · {request.units} units
                    </strong>
                    <span className="block mt-[3px] text-muted text-[10px] overflow-hidden text-ellipsis whitespace-nowrap">
                      {request.providerName ?? "Finding eligible provider"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2 pt-[10px] border-t border-[#edf1ef] text-muted text-[9.5px]">
                  <StatusBadge status={request.status} />
                  <span>{request.updatedAt}</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No blood requests yet"
            description="Create your first request to begin matching with eligible blood banks."
            action={<ButtonLink href="/hospital/requests/new">Create request</ButtonLink>}
          />
        )}
      </Panel>
    </>
  );
}

function needsAttention(request: BloodRequest): boolean {
  return (
    request.status === "REQUESTED" ||
    request.status === "IN_TRANSIT" ||
    (request.urgency === "CRITICAL" && activeStatuses.includes(request.status))
  );
}

function AttentionRequest({ request }: { request: BloodRequest }) {
  const inTransit = request.status === "IN_TRANSIT";
  const critical = request.urgency === "CRITICAL";
  const Icon = inTransit ? Route : critical ? AlertTriangle : TimerReset;
  const title = inTransit
    ? "Transfer is in transit"
    : critical
      ? "Critical request needs attention"
      : "Request awaiting provider response";

  return (
    <Link
      href={`/hospital/requests/${request.id}`}
      className="flex items-center gap-3 min-h-[60px] p-[10px] px-3 border border-border rounded-xl bg-surface-muted"
    >
      <span
        className={cn(
          "w-[33px] h-[33px] grid place-items-center shrink-0 rounded-[10px]",
          inTransit
            ? "text-info bg-info-soft"
            : critical
              ? "text-critical bg-critical-soft"
              : "text-warning bg-warning-soft",
        )}
      >
        <Icon size={17} />
      </span>
      <div className="min-w-0 flex-1">
        <strong className="block text-[11.5px]">{title}</strong>
        <p className="m-0 mt-[3px] text-muted text-[10.5px]">
          {formatBloodGroup(request.bloodGroup)} {formatComponent(request.component)} ·{" "}
          {request.units} units · updated {request.updatedAt}
        </p>
      </div>
      <ArrowRight size={15} className="text-muted-2" />
    </Link>
  );
}
