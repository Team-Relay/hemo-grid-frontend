/** Administrative network-stock prototype; it is not used for provider inventory mutations. */

"use client";

import { useState } from "react";
import { AlertTriangle, ArrowRight, Building2 } from "lucide-react";
import Link from "next/link";
import { BloodBadge, Panel, StockBadge, TableShell } from "@/components/ui/core";
import { bloodGroups, formatBloodGroup, getStockHealth } from "@/lib/domain";
import type { BloodComponent } from "@/types/domain";

const networkStock = [256, 31, 211, 63, 168, 47, 92, 14];

const facilityStock = [
  {
    id: "bank-1",
    name: "Maitama Blood Centre",
    location: "Maitama, Abuja",
    group: "O−",
    component: "RED_CELLS" as const,
    available: 8,
    reserved: 3,
  },
  {
    id: "bank-5",
    name: "National Transfusion Hub",
    location: "Central Area, Abuja",
    group: "O+",
    component: "WHOLE_BLOOD" as const,
    available: 42,
    reserved: 7,
  },
  {
    id: "bank-2",
    name: "Garki Regional Blood Bank",
    location: "Garki, Abuja",
    group: "A+",
    component: "PLATELETS" as const,
    available: 31,
    reserved: 4,
  },
  {
    id: "bank-4",
    name: "Unity Blood Services",
    location: "Utako, Abuja",
    group: "B+",
    component: "PLASMA" as const,
    available: 24,
    reserved: 3,
  },
];

const componentLabels: Record<BloodComponent, string> = {
  WHOLE_BLOOD: "Whole Blood",
  RED_CELLS: "Red Cells",
  PLATELETS: "Platelets",
  PLASMA: "Plasma",
};

export function NetworkInventoryView() {
  const [component, setComponent] = useState<"ALL" | BloodComponent>("ALL");
  const rows = facilityStock.filter(
    (facility) => component === "ALL" || facility.component === component,
  );

  return (
    <div className="space-y-6">
      {/* 8 Blood Group Network Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {bloodGroups.map((group, index) => (
          <Panel
            key={group}
            className="p-3.5 rounded-2xl bg-white border border-border shadow-sm flex flex-col justify-between space-y-2"
          >
            <div className="flex items-center justify-between">
              <BloodBadge group={group} />
              <StockBadge health={getStockHealth(Math.round(networkStock[index] / 8))} />
            </div>
            <div>
              <strong className="block text-xl font-bold text-ink tabular-nums mt-1">
                {networkStock[index]}
              </strong>
              <span className="text-[10.5px] text-muted block leading-tight">
                free {formatBloodGroup(group)} units
              </span>
            </div>
            <span className="text-[9.5px] text-slate-400 font-medium">
              {(index % 3) + 2} hubs active
            </span>
          </Panel>
        ))}
      </div>

      {/* Critical Deficit Alert Banner */}
      <div className="p-4 rounded-2xl bg-critical-soft/60 border border-critical/30 flex items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-critical text-white grid place-items-center shrink-0 shadow-sm">
            <AlertTriangle size={18} />
          </div>
          <div>
            <strong className="block text-xs font-bold text-ink">
              AB− Screened Inventory is Below Critical Network Threshold
            </strong>
            <p className="text-slate-600 text-[11.5px] mt-0.5">
              Only 14 free units remain across two participating regional blood banks in Abuja.
            </p>
          </div>
        </div>

        <Link
          href="/admin/facilities"
          className="inline-flex items-center gap-1 text-xs font-bold text-critical hover:underline whitespace-nowrap"
        >
          Review facilities <ArrowRight size={13} />
        </Link>
      </div>

      {/* Facility Inventory Table */}
      <div className="p-6 rounded-3xl bg-white border border-border shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-border">
          <div>
            <h2 className="text-base font-bold text-ink">Facilities with Available Stock</h2>
            <p className="text-xs text-muted mt-0.5">
              Screened inventory visible and ready for emergency requisition
            </p>
          </div>

          <select
            className="h-10 px-3 rounded-xl border border-border bg-surface-muted text-xs font-semibold text-slate-700 focus:outline-none focus:border-brand cursor-pointer"
            value={component}
            onChange={(event) => setComponent(event.target.value as typeof component)}
            aria-label="Filter by blood component"
          >
            <option value="ALL">All Component Preparations</option>
            {Object.entries(componentLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <TableShell>
          <thead>
            <tr className="border-b border-border text-[11.5px] font-semibold text-muted uppercase tracking-wider text-left">
              <th className="py-3 px-4">Fulfilment Facility</th>
              <th className="py-3 px-4">Location</th>
              <th className="py-3 px-4">Blood Group</th>
              <th className="py-3 px-4">Component</th>
              <th className="py-3 px-4">Available</th>
              <th className="py-3 px-4">Reserved</th>
              <th className="py-3 px-4">Free Available</th>
              <th className="py-3 px-4">Last Sync</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-xs">
            {rows.map((facility) => (
              <tr key={facility.name} className="hover:bg-surface-muted/50 transition-colors">
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-brand-soft border border-brand/20 grid place-items-center text-brand-dark shrink-0">
                      <Building2 size={14} />
                    </div>
                    <strong className="font-bold text-ink text-[13px]">{facility.name}</strong>
                  </div>
                </td>
                <td className="py-3.5 px-4 text-slate-700 font-medium">{facility.location}</td>
                <td className="py-3.5 px-4">
                  <span className="font-bold text-brand-dark bg-brand-soft px-2 py-0.5 rounded text-xs">
                    {facility.group}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-slate-700 font-medium">
                  {componentLabels[facility.component]}
                </td>
                <td className="py-3.5 px-4 font-bold text-ink tabular-nums">
                  {facility.available}{" "}
                  <span className="text-muted font-normal text-[11px]">units</span>
                </td>
                <td className="py-3.5 px-4 text-amber-700 font-semibold tabular-nums">
                  {facility.reserved}{" "}
                  <span className="text-muted font-normal text-[11px]">units</span>
                </td>
                <td className="py-3.5 px-4 font-bold text-emerald-700 tabular-nums">
                  {facility.available - facility.reserved}{" "}
                  <span className="text-muted font-normal text-[11px]">units</span>
                </td>
                <td className="py-3.5 px-4 text-muted text-[11.5px] whitespace-nowrap">
                  2 min ago
                </td>
                <td className="py-3.5 px-4 text-right">
                  <Link
                    href={`/admin/facilities/${facility.id}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:text-brand-dark transition-colors"
                  >
                    Inspect <ArrowRight size={13} />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      </div>
    </div>
  );
}
