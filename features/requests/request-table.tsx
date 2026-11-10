"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, ArrowUpDown, Search } from "lucide-react";
import {
  BloodBadge,
  ButtonLink,
  EmptyState,
  Pagination,
  StatusBadge,
  TableShell,
  UrgencyBadge,
} from "@/components/ui/core";
import { formatComponent } from "@/lib/domain";
import type { BloodRequest, BloodRequestStatus, RequestUrgency } from "@/types/domain";

export function RequestTable({
  requests,
  scope = "hospital",
}: {
  requests: BloodRequest[];
  scope?: "hospital" | "provider" | "admin";
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"ALL" | BloodRequestStatus>("ALL");
  const [urgency, setUrgency] = useState<"ALL" | RequestUrgency>("ALL");

  const rows = useMemo(
    () =>
      requests.filter((request) => {
        const haystack =
          `${request.reference} ${request.hospitalName} ${request.providerName ?? ""}`.toLowerCase();
        return (
          haystack.includes(query.toLowerCase()) &&
          (status === "ALL" || request.status === status) &&
          (urgency === "ALL" || request.urgency === urgency)
        );
      }),
    [requests, query, status, urgency],
  );

  const base =
    scope === "provider"
      ? "/blood-bank/requests"
      : scope === "admin"
        ? "/admin/requests"
        : "/hospital/requests";

  return (
    <div className="p-6 rounded-3xl bg-white border border-border shadow-sm space-y-4">
      {/* Toolbar & Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[260px] max-w-md">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search reference, hospital or blood bank…"
            className="w-full h-10 pl-10 pr-4 rounded-xl border border-border bg-surface-muted text-xs font-medium text-ink placeholder:text-muted focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            className="h-10 px-3 rounded-xl border border-border bg-surface-muted text-xs font-semibold text-slate-700 focus:outline-none focus:border-brand cursor-pointer"
            value={status}
            onChange={(event) => setStatus(event.target.value as typeof status)}
            aria-label="Filter by status"
          >
            <option value="ALL">All Request Statuses</option>
            {[
              "REQUESTED",
              "ACCEPTED",
              "PREPARING",
              "IN_TRANSIT",
              "DELIVERED",
              "DECLINED",
              "CANCELLED",
              "EXPIRED",
            ].map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>

          <select
            className="h-10 px-3 rounded-xl border border-border bg-surface-muted text-xs font-semibold text-slate-700 focus:outline-none focus:border-brand cursor-pointer"
            value={urgency}
            onChange={(event) => setUrgency(event.target.value as typeof urgency)}
            aria-label="Filter by urgency"
          >
            <option value="ALL">All Urgency Levels</option>
            <option value="ROUTINE">Routine Priority</option>
            <option value="URGENT">Urgent Priority</option>
            <option value="CRITICAL">Critical Emergency</option>
          </select>
        </div>
      </div>

      {requests.length === 0 ? (
        <EmptyState
          title={scope === "hospital" ? "No blood requests yet" : "No requests available"}
          description={
            scope === "hospital"
              ? "Create your first request to begin matching with eligible blood banks."
              : "Assigned requests will appear here when they become available."
          }
          action={
            scope === "hospital" ? (
              <ButtonLink href="/hospital/requests/new">Create request</ButtonLink>
            ) : undefined
          }
        />
      ) : rows.length ? (
        <>
          <TableShell>
            <thead>
              <tr className="border-b border-border text-[11.5px] font-semibold text-muted uppercase tracking-wider text-left">
                <th className="py-3 px-4">Request Ref</th>
                {scope !== "hospital" && <th className="py-3 px-4">Hospital</th>}
                <th className="py-3 px-4">Requirement</th>
                <th className="py-3 px-4">Urgency</th>
                <th className="py-3 px-4">Status</th>
                {scope !== "provider" && <th className="py-3 px-4">Fulfilment Hub</th>}
                <th className="py-3 px-4">
                  <span className="inline-flex items-center gap-1">
                    Created <ArrowUpDown size={12} />
                  </span>
                </th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-xs">
              {rows.map((request) => (
                <tr key={request.id} className="hover:bg-surface-muted/50 transition-colors">
                  <td className="py-3.5 px-4">
                    <Link href={`${base}/${request.id}`} className="group block">
                      <strong className="block font-bold text-ink text-[13px] group-hover:text-brand transition-colors">
                        {request.reference}
                      </strong>
                      <span className="text-[11px] text-muted block mt-0.5">
                        Updated {request.updatedAt}
                      </span>
                    </Link>
                  </td>

                  {scope !== "hospital" && (
                    <td className="py-3.5 px-4">
                      <strong className="block font-semibold text-ink">
                        {request.hospitalName}
                      </strong>
                      <span className="text-[11px] text-muted block mt-0.5">
                        {request.distanceKm ?? "—"} km away
                      </span>
                    </td>
                  )}

                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <BloodBadge group={request.bloodGroup} />
                      <div>
                        <strong className="block font-semibold text-ink">
                          {formatComponent(request.component)}
                        </strong>
                        <span className="text-[11px] text-muted">{request.units} units</span>
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <UrgencyBadge urgency={request.urgency} />
                  </td>

                  <td className="py-3.5 px-4">
                    <StatusBadge status={request.status} />
                  </td>

                  {scope !== "provider" && (
                    <td className="py-3.5 px-4">
                      <strong className="block font-semibold text-ink">
                        {request.providerName ?? "Awaiting Assignment"}
                      </strong>
                      <span className="text-[11px] text-muted block mt-0.5">
                        {request.providerName
                          ? `${request.distanceKm} km transit`
                          : "Searching network…"}
                      </span>
                    </td>
                  )}

                  <td className="py-3.5 px-4 text-muted text-[11.5px] whitespace-nowrap">
                    {request.createdAt}
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <Link
                      href={`${base}/${request.id}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:text-brand-dark transition-colors"
                    >
                      View <ArrowRight size={13} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </TableShell>
          <Pagination label={`Showing ${rows.length} of ${requests.length} emergency requests`} />
        </>
      ) : (
        <div className="py-12 px-4 text-center rounded-2xl bg-surface-muted border border-dashed border-border">
          <h3 className="text-sm font-bold text-ink">No matching blood requests</h3>
          <p className="text-xs text-muted mt-1">
            Adjust your search keywords or filter criteria to view requests.
          </p>
        </div>
      )}
    </div>
  );
}
