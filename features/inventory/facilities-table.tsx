"use client";
import { useMemo, useState } from "react";
import { Building2, Hospital, Search } from "lucide-react";
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
    <div className="panel table-panel">
      <div className="toolbar">
        <label className="search-field">
          <Search size={15} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search facility or location"
          />
        </label>
        <select
          className="filter-select"
          value={type}
          onChange={(e) => setType(e.target.value as typeof type)}
        >
          <option value="ALL">All facility types</option>
          <option value="HOSPITAL">Hospitals</option>
          <option value="BLOOD_BANK">Blood banks</option>
        </select>
        <select
          className="filter-select"
          value={status}
          onChange={(e) => setStatus(e.target.value as typeof status)}
        >
          <option value="ALL">All status</option>
          <option>ONLINE</option>
          <option>DEGRADED</option>
          <option>OFFLINE</option>
        </select>
      </div>
      <TableShell>
        <thead>
          <tr>
            <th>Facility</th>
            <th>Type</th>
            <th>Location</th>
            <th>Network status</th>
            <th>Active requests</th>
            <th>Total stock</th>
            <th>Last update</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {rows.map((o) => (
            <tr key={o.id}>
              <td>
                <div className="table-facility">
                  <span>
                    {o.type === "HOSPITAL" ? <Hospital size={15} /> : <Building2 size={15} />}
                  </span>
                  <strong>{o.name}</strong>
                </div>
              </td>
              <td>{o.type === "HOSPITAL" ? "Hospital" : "Blood bank"}</td>
              <td>{o.location}</td>
              <td>
                <span className={`network-badge ${o.networkStatus.toLowerCase()}`}>
                  <i />
                  {o.networkStatus.charAt(0) + o.networkStatus.slice(1).toLowerCase()}
                </span>
              </td>
              <td>{o.activeRequests}</td>
              <td>{o.totalStock ? `${o.totalStock} units` : "—"}</td>
              <td>{o.lastUpdated}</td>
              <td>
                <Link href={`/admin/facilities/${o.id}`} className="text-link">
                  Inspect →
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </TableShell>
      <Pagination label={`Showing ${rows.length} of ${organizations.length} facilities`} />
    </div>
  );
}
