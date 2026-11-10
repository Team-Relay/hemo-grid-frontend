"use client";

import { AlertTriangle, ArrowRight, Building2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

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
    <>
      <div className="network-inventory-cards">
        {bloodGroups.map((group, index) => (
          <Panel key={group} className="network-stock-card">
            <div>
              <BloodBadge group={group} />
              <StockBadge health={getStockHealth(Math.round(networkStock[index] / 8))} />
            </div>
            <strong>{networkStock[index]}</strong>
            <span>free {formatBloodGroup(group)} units</span>
            <small>Across {(index % 3) + 2} facilities</small>
          </Panel>
        ))}
      </div>

      <Panel className="critical-inventory-banner">
        <span>
          <AlertTriangle size={19} strokeWidth={1.8} />
        </span>
        <div>
          <strong>AB− inventory is below the network threshold</strong>
          <p>14 free units remain across two participating blood banks.</p>
        </div>
        <Link href="/admin/facilities" className="text-link">
          Review facilities <ArrowRight size={13} />
        </Link>
      </Panel>

      <Panel padding={false} className="table-panel">
        <div className="other-matches-head">
          <div>
            <h2>Facilities with available stock</h2>
            <p>Screened inventory visible across the network</p>
          </div>
          <select
            className="filter-select"
            value={component}
            onChange={(event) => setComponent(event.target.value as typeof component)}
            aria-label="Filter by blood component"
          >
            <option value="ALL">All components</option>
            {Object.entries(componentLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {rows.length > 0 ? (
          <TableShell>
            <thead>
              <tr>
                <th>Facility</th>
                <th>Location</th>
                <th>Blood group</th>
                <th>Component</th>
                <th>Available</th>
                <th>Reserved</th>
                <th>Free</th>
                <th>Updated</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((facility) => (
                <tr key={facility.name}>
                  <td>
                    <div className="table-facility">
                      <span>
                        <Building2 size={14} strokeWidth={1.8} />
                      </span>
                      <strong>{facility.name}</strong>
                    </div>
                  </td>
                  <td>{facility.location}</td>
                  <td>
                    <strong>{facility.group}</strong>
                  </td>
                  <td>{componentLabels[facility.component]}</td>
                  <td>{facility.available}</td>
                  <td>{facility.reserved}</td>
                  <td>
                    <strong>{facility.available - facility.reserved}</strong>
                  </td>
                  <td>2 min ago</td>
                  <td>
                    <Link href={`/admin/facilities/${facility.id}`} className="text-link">
                      Inspect <ArrowRight size={12} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </TableShell>
        ) : (
          <div className="state-box compact-state">
            <h3>No stock for this component</h3>
            <p>Choose another component to inspect available facilities.</p>
          </div>
        )}
      </Panel>
    </>
  );
}
