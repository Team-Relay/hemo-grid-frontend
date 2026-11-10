/** Administrative facility prototype kept separate from authenticated provider inventory. */

"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Building2, Hospital, Search } from "lucide-react";
import Link from "next/link";
import { Pagination, TableShell } from "@/components/ui/core";
import { organizations } from "@/lib/mock/data";
import type { FacilityStatus, OrganizationType } from "@/types/domain";

export function FacilitiesTable() {
  const [q, setQ] = useState("");
  const [type, setType] = useState<"ALL" | OrganizationType>("ALL");
  const [status, setStatus] = useState<"ALL" | FacilityStatus>("ALL");

  const rows = useMemo(
    () =>
      organizations.filter(
        (o) =>
          `${o.name} ${o.location}`.toLowerCase().includes(q.toLowerCase()) &&
          (type === "ALL" || o.type === type) &&
          (status === "ALL" || o.networkStatus === status),
      ),
    [q, type, status],
  );

  return (
    <div className="p-6 rounded-3xl bg-white border border-border shadow-sm space-y-4">
      {/* Toolbar & Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search facility name or location…"
            className="w-full h-10 pl-10 pr-4 rounded-xl border border-border bg-surface-muted text-xs font-medium text-ink placeholder:text-muted focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            className="h-10 px-3 rounded-xl border border-border bg-surface-muted text-xs font-semibold text-slate-700 focus:outline-none focus:border-brand cursor-pointer"
            value={type}
            onChange={(e) => setType(e.target.value as typeof type)}
          >
            <option value="ALL">All Facility Types</option>
            <option value="HOSPITAL">Hospitals (Trauma/Clinical)</option>
            <option value="BLOOD_BANK">Blood Banks (Screening/Hubs)</option>
          </select>

          <select
            className="h-10 px-3 rounded-xl border border-border bg-surface-muted text-xs font-semibold text-slate-700 focus:outline-none focus:border-brand cursor-pointer"
            value={status}
            onChange={(e) => setStatus(e.target.value as typeof status)}
          >
            <option value="ALL">All Telemetry States</option>
            <option value="ONLINE">Online & Synchronized</option>
            <option value="DEGRADED">Degraded Telemetry</option>
            <option value="OFFLINE">Offline</option>
          </select>
        </div>
      </div>

      {/* Table View */}
      <TableShell>
        <thead>
          <tr className="border-b border-border text-[11.5px] font-semibold text-muted uppercase tracking-wider text-left">
            <th className="py-3 px-4">Facility Name</th>
            <th className="py-3 px-4">Classification</th>
            <th className="py-3 px-4">Location</th>
            <th className="py-3 px-4">Network Status</th>
            <th className="py-3 px-4">Active Requests</th>
            <th className="py-3 px-4">Stock Reserves</th>
            <th className="py-3 px-4">Last Sync</th>
            <th className="py-3 px-4 text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border text-xs">
          {rows.map((o) => {
            const isHospital = o.type === "HOSPITAL";
            const isOnline = o.networkStatus === "ONLINE";
            const isDegraded = o.networkStatus === "DEGRADED";
            return (
              <tr key={o.id} className="hover:bg-surface-muted/50 transition-colors">
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-brand-soft border border-brand/20 grid place-items-center text-brand-dark shrink-0">
                      {isHospital ? <Hospital size={16} /> : <Building2 size={16} />}
                    </div>
                    <div>
                      <strong className="block font-bold text-ink text-[13px]">{o.name}</strong>
                      <span className="text-[11px] text-muted">{o.id}</span>
                    </div>
                  </div>
                </td>

                <td className="py-3.5 px-4 font-medium text-slate-700">
                  {isHospital ? "Trauma Hospital" : "Regional Blood Bank"}
                </td>

                <td className="py-3.5 px-4 text-slate-700 font-medium">{o.location}</td>

                <td className="py-3.5 px-4">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                      isOnline
                        ? "bg-success-soft text-success border border-success/20"
                        : isDegraded
                          ? "bg-warning-soft text-warning border border-warning/20"
                          : "bg-critical-soft text-critical border border-critical/20"
                    }`}
                  >
                    <i
                      className={`w-1.5 h-1.5 rounded-full ${
                        isOnline ? "bg-emerald-500" : isDegraded ? "bg-amber-500" : "bg-red-500"
                      }`}
                    />
                    {o.networkStatus.charAt(0) + o.networkStatus.slice(1).toLowerCase()}
                  </span>
                </td>

                <td className="py-3.5 px-4 font-bold text-ink tabular-nums">
                  {o.activeRequests}{" "}
                  <span className="text-muted font-normal text-[11px]">active</span>
                </td>

                <td className="py-3.5 px-4 font-bold text-ink tabular-nums">
                  {o.totalStock ? (
                    <>
                      {o.totalStock}{" "}
                      <span className="text-muted font-normal text-[11px]">units</span>
                    </>
                  ) : (
                    <span className="text-muted font-normal">—</span>
                  )}
                </td>

                <td className="py-3.5 px-4 text-muted text-[11.5px] whitespace-nowrap">
                  {o.lastUpdated}
                </td>

                <td className="py-3.5 px-4 text-right">
                  <Link
                    href={`/admin/facilities/${o.id}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:text-brand-dark transition-colors"
                  >
                    Inspect <ArrowRight size={13} />
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </TableShell>

      <Pagination label={`Showing ${rows.length} of ${organizations.length} network facilities`} />
    </div>
  );
}
