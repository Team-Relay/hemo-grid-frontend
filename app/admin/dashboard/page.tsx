/** Visual admin dashboard preview; see the layout notice for its API boundary. */

import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Building2,
  PackageOpen,
  Radio,
  Route,
  ShieldAlert,
} from "lucide-react";
import { NetworkMap } from "@/components/network/network-map";
import { Panel, SectionHeader, StatCard } from "@/components/ui/core";
import { activities } from "@/lib/mock/data";

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
            Network Operations
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink">
            Command Centre Preview
          </h1>
          <p className="text-xs sm:text-sm text-muted mt-1 max-w-xl">
            Preview of planned network availability and emergency fulfilment oversight.
          </p>
        </div>

        <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white border border-border shadow-sm">
          <span className="w-2 h-2 rounded-full bg-warning" />
          <span className="text-xs font-semibold text-ink">Demonstration dataset</span>
          <span className="text-[11px] text-muted border-l border-border pl-2">Not live</span>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <StatCard label="Participating facilities" value="18" detail="17 online" icon={Building2} />
        <StatCard
          label="Total free units"
          value="1,284"
          detail="across network"
          icon={PackageOpen}
          tone="success"
        />
        <StatCard
          label="Active critical requests"
          value="4"
          detail="2 awaiting"
          icon={ShieldAlert}
          tone="critical"
        />
        <StatCard label="Active transfers" value="7" detail="3 arriving soon" icon={Route} />
      </div>

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
                <Link
                  href="/admin/inventory"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:text-brand-dark transition-colors"
                >
                  Inspect <ArrowRight size={12} />
                </Link>
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

          {/* Stock Alerts Panel */}
          <Panel className="p-6">
            <SectionHeader
              title="Critical stock alerts"
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
                    <span className="text-[11px] text-muted">14 units across 2 facilities</span>
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
                    <strong className="block font-bold text-ink">O− Red Cells</strong>
                    <span className="text-[11px] text-muted">31 units · demand elevated</span>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-warning text-white uppercase tracking-wider">
                  Low Stock
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
            <Link
              href="/admin/requests"
              className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:text-brand-dark transition-colors"
            >
              All requests <ArrowRight size={12} />
            </Link>
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
                  <strong className="block text-xs font-bold text-ink truncate">{item.title}</strong>
                  <p className="text-[11px] text-muted line-clamp-2 mt-1 leading-relaxed">{item.detail}</p>
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
