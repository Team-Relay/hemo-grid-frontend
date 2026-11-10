import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Boxes,
  Clock3,
  FileInput,
  MapPin,
  PackageCheck,
  ShieldAlert,
} from "lucide-react";
import {
  BloodBadge,
  ButtonLink,
  Panel,
  SectionHeader,
  StatCard,
  StatusBadge,
  StockBadge,
  UrgencyBadge,
} from "@/components/ui/core";
import { formatBloodGroup, formatComponent, getFreeUnits, getStockHealth } from "@/lib/domain";
import { bloodRequests, inventory } from "@/lib/mock/data";

export default function BloodBankDashboard() {
  const critical = bloodRequests.find((request) => request.id === "req-0138")!;

  return (
    <div className="space-y-6">
      {/* Top Main Grid: Left Operational Hub + Right Inventory Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-5 items-start">
        {/* Left Column: Organization, Key Stats & Priority Incoming Action */}
        <div className="space-y-5">
          {/* Facility Status Bar */}
          <Panel className="flex flex-wrap items-center justify-between gap-4 p-6">
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-bold tracking-tight text-ink">Maitama Blood Centre</h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-brand-soft text-brand-dark border border-brand/20">
                  Regional Screening Hub
                </span>
              </div>
              <div className="flex items-center gap-2 mt-2 text-xs text-muted">
                <Clock3 size={14} className="text-muted" />
                <span>Inventory synchronized</span>
                <span className="font-semibold text-ink">2 minutes ago</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-surface-muted border border-border">
              <span className="text-xs text-muted">System status</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-success-soft text-success border border-success/20">
                <i className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Operational
              </span>
            </div>
          </Panel>

          {/* Core Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <StatCard label="Incoming requests" value="6" detail="3 new" icon={FileInput} />
            <StatCard
              label="Critical requests"
              value="2"
              detail="needs action"
              icon={ShieldAlert}
              tone="critical"
            />
            <StatCard
              label="Units available"
              value="97"
              detail="8 groups"
              icon={Boxes}
              tone="success"
            />
            <StatCard
              label="Units reserved"
              value="22"
              detail="5 transfers"
              icon={PackageCheck}
              tone="warning"
            />
          </div>

          {/* Critical Emergency Request Hero Card */}
          <Panel className="p-6 border-critical/30 bg-gradient-to-b from-critical-soft/30 via-white to-white shadow-sm relative overflow-hidden">
            {/* Urgent Status Ribbon */}
            <div className="flex items-center justify-between gap-2 mb-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-critical text-white shadow-sm">
                <AlertTriangle size={13} /> Immediate Fulfilment Required
              </span>
              <span className="text-xs text-critical font-medium flex items-center gap-1">
                <Activity size={13} /> Priority Dispatch
              </span>
            </div>

            {/* Request Meta Header */}
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <span className="text-[11px] font-bold text-brand uppercase tracking-wider">
                  {critical.reference}
                </span>
                <h2 className="text-xl font-bold tracking-tight text-ink mt-0.5">
                  {critical.hospitalName}
                </h2>
                <p className="text-xs text-muted mt-0.5">
                  Emergency blood request received just now
                </p>
              </div>
              <UrgencyBadge urgency={critical.urgency} />
            </div>

            {/* Requirement Box */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-surface-muted border border-border my-4">
              <div className="flex items-center gap-3.5">
                <BloodBadge group={critical.bloodGroup} large />
                <div>
                  <strong className="block text-sm font-bold text-ink">
                    {formatBloodGroup(critical.bloodGroup)} {formatComponent(critical.component)}
                  </strong>
                  <span className="text-xs font-semibold text-critical">
                    {critical.units} units required
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-end pl-4 border-l border-border">
                <div className="flex items-center gap-1 text-sm font-bold text-ink">
                  <MapPin size={14} className="text-brand" /> 6.4 km
                </div>
                <span className="text-[11px] text-muted">Distance to hospital</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <ButtonLink href={`/blood-bank/requests/${critical.id}`} variant="secondary">
                Review request
              </ButtonLink>
              <ButtonLink href={`/blood-bank/requests/${critical.id}`} variant="primary">
                Accept request <ArrowRight size={14} />
              </ButtonLink>
            </div>
          </Panel>
        </div>

        {/* Right Column: Real-Time Inventory Health */}
        <Panel className="p-6 space-y-5">
          <SectionHeader
            title="Inventory health"
            description="Free screened units ready for dispatch"
            action={
              <Link
                href="/blood-bank/inventory"
                className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:text-brand-dark transition-colors"
              >
                Full inventory <ArrowRight size={13} />
              </Link>
            }
          />

          {/* Blood Group Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {inventory.slice(0, 4).map((item) => {
              const free = getFreeUnits(item);
              const percentage = Math.min(100, (free / 30) * 100);
              return (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl bg-white border border-border shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <BloodBadge group={item.bloodGroup} />
                    <StockBadge health={getStockHealth(free)} />
                  </div>

                  <div>
                    <h3 className="text-xs font-semibold text-ink">
                      {formatBloodGroup(item.bloodGroup)}{" "}
                      <span className="font-normal text-muted">{formatComponent(item.component)}</span>
                    </h3>
                    <div className="flex items-baseline gap-1.5 mt-1">
                      <strong className="text-2xl font-bold text-ink tabular-nums">{free}</strong>
                      <span className="text-xs text-muted">free units</span>
                    </div>
                  </div>

                  {/* Stock Level Bar */}
                  <div className="w-full h-1.5 bg-surface-muted rounded-full overflow-hidden border border-border/40">
                    <div
                      className="h-full bg-brand rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>

                  <div className="text-[10.5px] text-muted flex items-center justify-between">
                    <span>{item.availableUnits} total units</span>
                    <span>{item.reservedUnits} reserved</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Low Stock Warning Alert */}
          <div className="p-4 rounded-2xl bg-warning-soft/60 border border-warning/30 flex items-start gap-3 text-xs">
            <AlertTriangle size={18} className="text-warning shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold text-ink block">AB− Whole Blood is critically low</strong>
              <p className="text-slate-600 text-[11.5px] mt-0.5 leading-relaxed">
                Only 2 free units remain in screened reserves. Trigger urgent donor collection or reserve stock for emergency trauma cases.
              </p>
            </div>
          </div>
        </Panel>
      </div>

      {/* Bottom Section: Recent Fulfilment Activity */}
      <Panel className="p-6">
        <SectionHeader
          title="Recent fulfilment activity"
          description="Latest emergency blood requests assigned to Maitama Blood Centre"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mt-4">
          {bloodRequests.slice(0, 4).map((request) => (
            <Link
              href={`/blood-bank/requests/${request.id}`}
              key={request.id}
              className="group p-4 rounded-2xl bg-white border border-border shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:border-brand/40 hover:shadow-md transition-all duration-150 flex flex-col justify-between"
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <strong className="text-xs font-semibold text-ink group-hover:text-brand transition-colors line-clamp-1">
                  {request.hospitalName}
                </strong>
                <UrgencyBadge urgency={request.urgency} />
              </div>

              <div className="flex items-center gap-3 my-2">
                <BloodBadge group={request.bloodGroup} />
                <div className="min-w-0">
                  <strong className="block text-xs font-bold text-ink truncate">
                    {formatComponent(request.component)} · {request.units} units
                  </strong>
                  <span className="text-[11px] text-muted truncate block">{request.reference}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 mt-2 border-t border-border text-[11px] text-muted">
                <StatusBadge status={request.status} />
                <span className="text-[10.5px]">{request.updatedAt}</span>
              </div>
            </Link>
          ))}
        </div>
      </Panel>
    </div>
  );
}
