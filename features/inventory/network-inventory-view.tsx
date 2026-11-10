/** Administrative network-stock view backed by the Terumo BCT Kenya Blood Network dataset. */

"use client";

import { useState } from "react";
import { ArrowRight, Building2 } from "lucide-react";
import {
  ActionLink,
  ColdChainBadge,
  FeedbackBanner,
  StockBadge,
  TableShell,
} from "@/components/ui/core";
import { bloodGroups, formatBloodGroup, getStockHealth } from "@/lib/domain";
import type { BloodComponent } from "@/types/domain";

const networkStock = [256, 31, 211, 63, 168, 47, 92, 14];

const facilityStock = [
  {
    id: "bank-1",
    code: "RBTC-NBO",
    name: "Nairobi RBTC",
    location: "Nairobi, Nairobi County",
    group: "O−",
    component: "RED_CELLS" as const,
    available: 16,
    reserved: 4,
    quarantined: 0,
    tempCelsius: 3.7,
    coldChainVerified: true,
  },
  {
    id: "bank-5",
    code: "RBTC-ELD",
    name: "Eldoret RBTC",
    location: "Eldoret, Uasin Gishu County",
    group: "O+",
    component: "WHOLE_BLOOD" as const,
    available: 42,
    reserved: 7,
    quarantined: 0,
    tempCelsius: 4.0,
    coldChainVerified: true,
  },
  {
    id: "bank-2",
    code: "RBTC-EMB",
    name: "Embu RBTC",
    location: "Embu, Embu County",
    group: "A+",
    component: "PLATELETS" as const,
    available: 31,
    reserved: 4,
    quarantined: 0,
    tempCelsius: 4.1,
    coldChainVerified: true,
  },
  {
    id: "bank-4",
    code: "RBTC-MSA",
    name: "Mombasa RBTC",
    location: "Mombasa, Mombasa County",
    group: "B+",
    component: "PLASMA" as const,
    available: 24,
    reserved: 3,
    quarantined: 3,
    tempCelsius: 6.8,
    coldChainVerified: false,
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
      {/* Unified 8 Blood Group Inventory Matrix */}
      <div className="rounded-xl bg-white border border-border shadow-xs overflow-hidden">
        <div className="px-5 py-3 border-b border-border/80 bg-surface-muted/40 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-ink">Aggregated Blood Reserves</span>
            <span className="text-muted">· 8 ABO/Rh Groups across connected fulfilment hubs</span>
          </div>
          <span className="text-[11px] font-semibold text-slate-600 tabular-nums">
            Total Free Available: {networkStock.reduce((a, b) => a + b, 0)} units
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 divide-y sm:divide-y-0 sm:divide-x divide-border">
          {bloodGroups.map((group, index) => {
            const count = networkStock[index];
            const health = getStockHealth(Math.round(count / 8));
            return (
              <div
                key={group}
                className="p-3.5 flex flex-col justify-between hover:bg-surface-muted/40 transition-colors"
              >
                <div className="flex items-center justify-between gap-1 mb-2">
                  <span className="inline-flex items-center justify-center min-w-[28px] px-1.5 h-6 rounded-md bg-brand-soft border border-brand/20 font-bold text-xs text-brand-dark tabular-nums tracking-tight font-mono shrink-0">
                    {formatBloodGroup(group)}
                  </span>
                  <StockBadge health={health} className="text-[10px] px-2 py-0.5" />
                </div>
                <div className="my-1">
                  <strong className="text-xl sm:text-2xl font-bold tracking-tight text-ink tabular-nums block leading-none">
                    {count}
                  </strong>
                  <span className="text-[11px] text-muted block truncate font-medium mt-1">
                    free {formatBloodGroup(group)}
                  </span>
                </div>
                <div className="pt-2 mt-1 border-t border-border/50 text-[10px] text-slate-400 font-medium">
                  {(index % 3) + 4} hubs active
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Deficit Alert Banner */}
      <FeedbackBanner
        tone="warning"
        title="AB− &amp; O− Screened Reserves Below Regional Buffer Threshold"
        message="Only 14 free AB− units and 31 free O− units remain across the regional hubs. Universal O− conservation rules and cold-chain safety gates are enforced."
        action={
          <ActionLink
            href="/admin/facilities"
            pendingLabel="Opening…"
            className="text-amber-800 hover:text-amber-900 whitespace-nowrap text-xs font-semibold"
          >
            Review facilities <ArrowRight size={13} />
          </ActionLink>
        }
      />

      {/* Facility Inventory Table */}
      <div className="p-5 rounded-xl bg-white border border-border shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-border">
          <div>
            <h2 className="text-base font-bold text-ink">Facilities with Available Stock</h2>
            <p className="text-xs text-muted mt-0.5">
              Screened inventory visible and cold-chain verified for emergency requisition
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
              <th className="py-3 px-4">Cold-Chain Gate</th>
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
                    <div>
                      <strong className="font-bold text-ink text-[13px] block">
                        {facility.name}
                      </strong>
                      <span className="text-[10.5px] text-muted">{facility.code}</span>
                    </div>
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
                <td className="py-3.5 px-4">
                  <ColdChainBadge
                    verified={facility.coldChainVerified}
                    tempCelsius={facility.tempCelsius}
                    quarantinedUnits={facility.quarantined}
                  />
                </td>
                <td className="py-3.5 px-4 text-right">
                  <ActionLink href={`/admin/facilities/${facility.id}`} pendingLabel="Inspecting…">
                    Inspect <ArrowRight size={13} />
                  </ActionLink>
                </td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      </div>
    </div>
  );
}
