"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowUpDown, Search } from "lucide-react";
import {
  BloodBadge,
  Pagination,
  StatusBadge,
  TableShell,
  UrgencyBadge,
} from "@/components/ui/core";
import { formatComponent } from "@/lib/domain";
import { bloodRequests } from "@/lib/mock/data";
import type { BloodRequestStatus, RequestUrgency } from "@/types/domain";

export function RequestTable({
  scope = "hospital",
}: {
  scope?: "hospital" | "provider" | "admin";
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"ALL" | BloodRequestStatus>("ALL");
  const [urgency, setUrgency] = useState<"ALL" | RequestUrgency>("ALL");
  const rows = useMemo(
    () =>
      bloodRequests.filter((request) => {
        const haystack =
          `${request.reference} ${request.hospitalName} ${request.providerName ?? ""}`.toLowerCase();
        return (
          haystack.includes(query.toLowerCase()) &&
          (status === "ALL" || request.status === status) &&
          (urgency === "ALL" || request.urgency === urgency)
        );
      }),
    [query, status, urgency],
  );
  const base =
    scope === "provider"
      ? "/blood-bank/requests"
      : scope === "admin"
        ? "/admin/requests"
        : "/hospital/requests";
  return (
    <div className="panel table-panel">
      <div className="toolbar">
        <label className="search-field">
          <Search size={15} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search reference, hospital or provider"
          />
        </label>
        <select
          className="filter-select"
          value={status}
          onChange={(event) => setStatus(event.target.value as typeof status)}
          aria-label="Filter by status"
        >
          <option value="ALL">All statuses</option>
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
            <option key={value}>{value}</option>
          ))}
        </select>
        <select
          className="filter-select"
          value={urgency}
          onChange={(event) => setUrgency(event.target.value as typeof urgency)}
          aria-label="Filter by urgency"
        >
          <option value="ALL">All urgency</option>
          <option>ROUTINE</option>
          <option>URGENT</option>
          <option>CRITICAL</option>
        </select>
      </div>
      {rows.length ? (
        <>
          <TableShell>
            <thead>
              <tr>
                <th>Request</th>
                {scope !== "hospital" && <th>Hospital</th>}
                <th>Requirement</th>
                <th>Urgency</th>
                <th>Status</th>
                {scope !== "provider" && <th>Provider</th>}
                <th>
                  <span className="th-sort">
                    Created <ArrowUpDown size={12} />
                  </span>
                </th>
                <th aria-label="Open" />
              </tr>
            </thead>
            <tbody>
              {rows.map((request) => (
                <tr key={request.id}>
                  <td>
                    <Link href={`${base}/${request.id}`}>
                      <span className="table-primary">{request.reference}</span>
                      <span className="table-secondary">Updated {request.updatedAt}</span>
                    </Link>
                  </td>
                  {scope !== "hospital" && (
                    <td>
                      <span className="table-primary">{request.hospitalName}</span>
                      <span className="table-secondary">{request.distanceKm ?? "—"} km away</span>
                    </td>
                  )}
                  <td>
                    <div className="requirement-cell">
                      <BloodBadge group={request.bloodGroup} />
                      <span>
                        <span className="table-primary">{formatComponent(request.component)}</span>
                        <span className="table-secondary">{request.units} units</span>
                      </span>
                    </div>
                  </td>
                  <td>
                    <UrgencyBadge urgency={request.urgency} />
                  </td>
                  <td>
                    <StatusBadge status={request.status} />
                  </td>
                  {scope !== "provider" && (
                    <td>
                      <span className="table-primary">
                        {request.providerName ?? "Not selected"}
                      </span>
                      <span className="table-secondary">
                        {request.providerName ? `${request.distanceKm} km` : "Searching network"}
                      </span>
                    </td>
                  )}
                  <td>{request.createdAt}</td>
                  <td>
                    <Link href={`${base}/${request.id}`} className="text-link">
                      Open →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </TableShell>
          <Pagination label={`Showing ${rows.length} of ${bloodRequests.length} requests`} />
        </>
      ) : (
        <div className="state-box">
          <h3>No matching requests</h3>
          <p>Adjust the search or filters to view more requests.</p>
        </div>
      )}
    </div>
  );
}
