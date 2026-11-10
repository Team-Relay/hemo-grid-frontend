/** Visual admin dashboard preview backed by the Terumo BCT Kenya Blood Network dataset. */

import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Building2,
  PackageOpen,
  Radio,
  Route,
  ShieldAlert,
  Sparkles,
  ThermometerSnowflake,
} from "lucide-react";
import { NetworkMap } from "@/components/network/network-map";
import { ActionLink, Panel, SectionHeader, StatCard } from "@/components/ui/core";
import { activities, dispatchBenchmarkSummary } from "@/lib/mock/data";

const availability = [
  { g: "O+", n: 256, s: "Healthy", p: 88 },
  { g: "O−", n: 31, s: "Low", p: 28 },
  { g: "A+", n: 211, s: "Healthy", p: 76 },
  { g: "A−", n: 63, s: "Healthy", p: 58 },
  { g: "B+", n: 168, s: "Healthy", p: 69 },
  { g: "B−", n: 47, s: "Moderate", p: 43 },
  { g: "AB+", n: 92, s: "Healthy", p: 62 },
  { g: "AB−", n: 14, s: "Critical", p: 14 },
];

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold text-brand uppercase tracking-wider block mb-1">
            National Blood Coordination Network · 6 Regional Hubs · 9 Satellites · 32 Hospitals
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink">
            Command Centre &amp; Dispatch Performance
          </h1>
          <p className="text-xs sm:text-sm text-muted mt-1 max-w-2xl">
            Network-wide oversight across 47 regional facilities, 2,162 road corridors, cold-chain
            telemetry gates, and real-time Smart Dispatch vs. legacy hospital allocation.
          </p>
        </div>

        <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white border border-border shadow-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold text-ink">Live Network Telemetry</span>
          <span className="text-[11px] text-muted border-l border-border pl-2">
            3,666 Emergency Requisitions
          </span>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <StatCard
          label="Participating facilities"
          value={dispatchBenchmarkSummary.totalFacilities}
          detail="6 RBTCs · 9 Satellites · 32 Hospitals"
          icon={Building2}
        />
        <StatCard
          label="Smart Dispatch match rate"
          value={`${dispatchBenchmarkSummary.hemogridV2FulfilmentPct}%`}
          detail={`vs ${dispatchBenchmarkSummary.statusQuoFulfilmentPct}% legacy allocation (+25.0%)`}
          icon={PackageOpen}
          tone="success"
        />
        <StatCard
          label="Median road transit ETA"
          value={`${dispatchBenchmarkSummary.hemogridV2MedianWaitHours}h`}
          detail={`vs ${dispatchBenchmarkSummary.statusQuoMedianWaitHours}h legacy wait (-50.9%)`}
          icon={Route}
        />
        <StatCard
          label="Cold-chain units quarantined"
          value={dispatchBenchmarkSummary.quarantinedExcursionUnitsInStock}
          detail=">6°C excursion units blocked"
          icon={ShieldAlert}
          tone="critical"
        />
      </div>

      {/* Smart Dispatch vs Status Quo Benchmark Panel */}
      <Panel className="p-6 space-y-5 bg-white border border-border shadow-xs">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-brand-dark">
              <Sparkles size={13} className="text-brand" /> National Clinical Dispatch Performance
            </span>
            <h2 className="text-base sm:text-lg font-bold text-ink mt-0.5">
              HemoGrid Smart Dispatch vs. Legacy Allocation (3,666 Emergency Cases)
            </h2>
          </div>
          <ActionLink href="/admin/facilities" pendingLabel="Opening…">
            Inspect 47 facilities <ArrowRight size={13} />
          </ActionLink>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-surface-muted/60 border border-border flex flex-col justify-between space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-muted">Emergency Fulfilment Rate</span>
              <span className="px-2 py-0.5 rounded-md bg-success-soft text-success border border-success/20 font-bold text-[10.5px]">
                +25.0% Fulfilment
              </span>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <strong className="text-2xl font-bold text-ink tabular-nums">94.6%</strong>
                <span className="text-xs text-muted">Smart Dispatch (3,468 / 3,666)</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed mt-1.5">
                Status Quo rigid RBTC assignment fulfils only{" "}
                <strong className="text-slate-800">69.6% (2,553 / 3,666)</strong> during local hospital stockouts.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-surface-muted/60 border border-border flex flex-col justify-between space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-muted">Universal O− Conservation</span>
              <span className="px-2 py-0.5 rounded-md bg-brand-soft text-brand-dark border border-brand/20 font-bold text-[10.5px]">
                98.6% O− Saved
              </span>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <strong className="text-2xl font-bold text-ink tabular-nums">0.4%</strong>
                <span className="text-xs text-muted">non-O− drain (15 cases)</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed mt-1.5">
                Status Quo expends scarce O− on non-O− patients in{" "}
                <strong className="text-slate-800">31.0% (1,090 cases)</strong>. HemoGrid preserves O− for the{" "}
                <strong className="text-slate-800">442 unknown-group trauma</strong> emergencies.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-surface-muted/60 border border-border flex flex-col justify-between space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-muted">Corridor Re-Assignment</span>
              <span className="px-2 py-0.5 rounded-md bg-info-soft text-info border border-info/20 font-bold text-[10.5px]">
                2 Hubs Re-Routed
              </span>
            </div>
            <div className="space-y-1.5 pt-0.5">
              {dispatchBenchmarkSummary.corridorReassignments.map((corridor) => (
                <div
                  key={corridor.hospitalId}
                  className="p-2 rounded-lg bg-white border border-border text-[11px] flex items-center justify-between gap-2 shadow-2xs"
                >
                  <div className="min-w-0">
                    <strong className="font-semibold text-ink block truncate">
                      {corridor.hospitalId} ({corridor.hospitalName})
                    </strong>
                    <span className="block text-[10.5px] text-muted truncate">
                      {corridor.currentHub} ({corridor.currentHours}h) →{" "}
                      <strong className="text-brand-dark">
                        {corridor.recommendedHub} ({corridor.recommendedHours}h)
                      </strong>
                    </span>
                  </div>
                  <span className="px-1.5 py-0.5 rounded bg-success-soft text-success border border-success/20 font-bold text-[10px] shrink-0">
                    −{corridor.hoursSaved}h
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Panel>

      {/* Main Grid: Network Map & Availability Stack */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-5 items-start">
        <NetworkMap />

        <div className="space-y-5">
          {/* Blood Availability Panel */}
          <Panel className="p-6">
            <SectionHeader
              title="Blood availability"
              description="Free screened units across all connected facilities"
              action={
                <ActionLink href="/admin/inventory" pendingLabel="Opening…">
                  Inspect <ArrowRight size={12} />
                </ActionLink>
              }
            />
            <div className="grid grid-cols-2 gap-2.5 mt-4">
              {availability.map((item) => {
                const isCritical = item.s === "Critical";
                const isLow = item.s === "Low";
                const isModerate = item.s === "Moderate";
                return (
                  <div
                    key={item.g}
                    className="p-3 rounded-xl bg-surface-muted border border-border flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 rounded-lg bg-brand-soft border border-brand/20 grid place-items-center font-bold text-brand-dark text-xs">
                        {item.g}
                      </span>
                      <div>
                        <strong className="block text-xs font-bold text-ink">{item.n} units</strong>
                        <span className="text-[10px] text-muted">Available</span>
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        isCritical
                          ? "bg-critical-soft text-critical border border-critical/30"
                          : isLow
                            ? "bg-warning-soft text-warning border border-warning/30"
                            : isModerate
                              ? "bg-info-soft text-info border border-info/30"
                              : "bg-success-soft text-success border border-success/30"
                      }`}
                    >
                      {item.s}
                    </span>
                  </div>
                );
              })}
            </div>
          </Panel>

          {/* Stock & Cold-Chain Alerts Panel */}
          <Panel className="p-6">
            <SectionHeader
              title="Critical stock & cold-chain alerts"
              description="Conditions requiring regional dispatch attention"
            />
            <div className="space-y-2.5 mt-4">
              <div className="p-3.5 rounded-xl bg-critical-soft/40 border border-critical/30 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-critical-soft text-critical grid place-items-center shrink-0">
                    <AlertTriangle size={15} />
                  </div>
                  <div>
                    <strong className="block font-bold text-ink">AB− Whole Blood</strong>
                    <span className="text-[11px] text-muted">14 units across 6 RBTCs</span>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-critical text-white uppercase tracking-wider">
                  Critical
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-warning-soft/40 border border-warning/30 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-warning-soft text-warning grid place-items-center shrink-0">
                    <Radio size={15} />
                  </div>
                  <div>
                    <strong className="block font-bold text-ink">O− Red Cells (Universal)</strong>
                    <span className="text-[11px] text-muted">
                      31 units · O− conservation gate active
                    </span>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-warning text-white uppercase tracking-wider">
                  Protected
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-surface-muted border border-border flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-brand-soft text-brand-dark grid place-items-center shrink-0">
                    <ThermometerSnowflake size={15} />
                  </div>
                  <div>
                    <strong className="block font-bold text-ink">
                      Mombasa RBTC Cold-Chain Gate
                    </strong>
                    <span className="text-[11px] text-muted">
                      3 units quarantined (&gt;6.0°C outage excursion)
                    </span>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-white uppercase tracking-wider">
                  Blocked
                </span>
              </div>
            </div>
          </Panel>
        </div>
      </div>

      {/* Bottom Network Activity Row */}
      <Panel className="p-6">
        <SectionHeader
          title="Recent network activity"
          description="Operational events across all participating facilities"
          action={
            <ActionLink href="/admin/requests" pendingLabel="Opening…">
              All requests <ArrowRight size={12} />
            </ActionLink>
          }
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mt-4">
          {activities.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-2xl bg-white border border-border shadow-sm flex flex-col justify-between"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-brand-soft text-brand-dark grid place-items-center shrink-0 mt-0.5">
                  <Activity size={14} />
                </div>
                <div className="min-w-0">
                  <strong className="block text-xs font-bold text-ink truncate">
                    {item.title}
                  </strong>
                  <p className="text-[11px] text-muted line-clamp-2 mt-1 leading-relaxed">
                    {item.detail}
                  </p>
                </div>
              </div>
              <div className="pt-3 mt-3 border-t border-border text-[10.5px] text-muted">
                {item.timestamp}
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
