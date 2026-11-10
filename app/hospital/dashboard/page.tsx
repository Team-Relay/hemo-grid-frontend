import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Clock3,
  FileClock,
  PackageCheck,
  Radio,
  Route,
  TimerReset,
} from "lucide-react";
import { NetworkMap } from "@/components/network/network-map";
import {
  BloodBadge,
  ButtonLink,
  Panel,
  SectionHeader,
  StatCard,
  StatusBadge,
  UrgencyBadge,
} from "@/components/ui/core";
import { formatComponent } from "@/lib/domain";
import { bloodRequests } from "@/lib/mock/data";

export default function HospitalDashboard() {
  return (
    <>
      <div className="grid grid-cols-[minmax(0,1.08fr)_minmax(430px,0.92fr)] items-stretch gap-4">
        <div className="flex flex-col gap-[14px] min-w-0">
          <Panel className="min-h-[120px] flex items-start justify-between gap-5 p-[23px] px-6">
            <div>
              <h1 className="m-0 mb-[9px] text-[21px] tracking-[-0.03em]">Central Care Hospital</h1>
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
              <strong className="inline-flex items-center gap-[7px] px-[10px] py-[7px] rounded-full bg-success-soft text-success text-[11px] font-bold">
                <i className="w-[6px] h-[6px] rounded-full bg-current shadow-[0_0_0_4px_color-mix(in_srgb,currentColor_12%,transparent)]" /> Connected
              </strong>
            </div>
          </Panel>
          <div className="grid grid-cols-4 gap-3">
            <StatCard label="Active requests" value="7" detail="2 critical" icon={FileClock} />
            <StatCard
              label="Awaiting response"
              value="2"
              detail="needs action"
              icon={TimerReset}
              tone="warning"
            />
            <StatCard label="In transit" value="1" detail="ETA 18 min" icon={Route} />
            <StatCard
              label="Completed today"
              value="12"
              detail="+3 vs avg."
              icon={PackageCheck}
              tone="success"
            />
          </div>
          <Panel className="p-[18px]">
            <SectionHeader
              title="Requires attention"
              description="Operational exceptions across your active requests"
              action={
                <Link href="/hospital/requests" className="inline-flex items-center gap-[5px] text-brand text-[11px] font-[650]">
                  View requests <ArrowRight size={13} />
                </Link>
              }
            />
            <div className="grid gap-2">
              <Link
                href="/hospital/requests/req-0138/matches"
                className="flex items-center gap-3 min-h-[60px] p-[10px] px-3 border border-border rounded-xl bg-surface-muted"
              >
                <span className="w-[33px] h-[33px] grid place-items-center shrink-0 rounded-[10px] text-critical bg-critical-soft">
                  <AlertTriangle size={17} />
                </span>
                <div className="min-w-0 flex-1">
                  <strong className="block text-[11.5px]">Critical request awaiting response</strong>
                  <p className="m-0 mt-[3px] text-muted text-[10.5px]">O+ Red Cells · 5 units · created just now</p>
                </div>
                <ArrowRight size={15} className="text-muted-2" />
              </Link>
              <Link href="/hospital/network" className="flex items-center gap-3 min-h-[60px] p-[10px] px-3 border border-border rounded-xl bg-surface-muted">
                <span className="w-[33px] h-[33px] grid place-items-center shrink-0 rounded-[10px] text-warning bg-warning-soft">
                  <Radio size={17} />
                </span>
                <div className="min-w-0 flex-1">
                  <strong className="block text-[11.5px]">AB− network availability is low</strong>
                  <p className="m-0 mt-[3px] text-muted text-[10.5px]">14 free units visible across 3 facilities</p>
                </div>
                <ArrowRight size={15} className="text-muted-2" />
              </Link>
              <Link href="/hospital/requests/req-0140" className="flex items-center gap-3 min-h-[60px] p-[10px] px-3 border border-border rounded-xl bg-surface-muted">
                <span className="w-[33px] h-[33px] grid place-items-center shrink-0 rounded-[10px] text-info bg-info-soft">
                  <Route size={17} />
                </span>
                <div className="min-w-0 flex-1">
                  <strong className="block text-[11.5px]">Transfer arriving shortly</strong>
                  <p className="m-0 mt-[3px] text-muted text-[10.5px]">HG-2026-0140 · estimated handover in 18 minutes</p>
                </div>
                <ArrowRight size={15} className="text-muted-2" />
              </Link>
            </div>
          </Panel>
        </div>
        <NetworkMap />
      </div>
      <Panel className="col-span-full mt-4 p-[18px]">
        <SectionHeader
          title="Recent requests"
          description="Latest activity from Central Care Hospital"
          action={
            <ButtonLink href="/hospital/requests/new" variant="secondary">
              New request
            </ButtonLink>
          }
        />
        <div className="grid grid-cols-4 gap-[10px]">
          {bloodRequests.slice(0, 4).map((request) => (
            <Link
              href={`/hospital/requests/${request.id}`}
              key={request.id}
              className="min-w-0 min-h-[154px] flex flex-col p-[15px] border border-border rounded-[13px] bg-surface transition-transform duration-150 ease-in-out overflow-hidden hover:border-border-strong hover:-translate-y-[1px]"
            >
              <div className="flex items-center justify-between gap-2">
                <strong className="text-[11.5px] overflow-hidden text-ellipsis whitespace-nowrap">{request.reference}</strong>
                <UrgencyBadge urgency={request.urgency} />
              </div>
              <div className="flex items-center gap-[9px] flex-1 my-[14px]">
                <BloodBadge group={request.bloodGroup} />
                <div className="min-w-0">
                  <strong className="block text-[12px] overflow-hidden text-ellipsis whitespace-nowrap">
                    {formatComponent(request.component)} · {request.units} units
                  </strong>
                  <span className="block mt-[3px] text-muted text-[10px] overflow-hidden text-ellipsis whitespace-nowrap">{request.providerName ?? "Finding eligible provider"}</span>
                </div>
              </div>
              <div className="flex items-center justify-between gap-2 pt-[10px] border-t border-[#edf1ef] text-muted text-[9.5px]">
                <StatusBadge status={request.status} />
                <span>{request.updatedAt}</span>
              </div>
            </Link>
          ))}
        </div>
      </Panel>
    </>
  );
}
