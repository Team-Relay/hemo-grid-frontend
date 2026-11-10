"use client";

import { useCallback, useMemo, useState } from "react";
import { ArrowUpDown, Edit3, Search, X } from "lucide-react";
import { BloodBadge, Button, Pagination, StockBadge, TableShell } from "@/components/ui/core";
import {
  bloodComponents,
  bloodGroups,
  formatBloodGroup,
  formatComponent,
  getFreeUnits,
  getStockHealth,
} from "@/lib/domain";
import { inventory as initialInventory } from "@/lib/mock/data";
import { useDialogFocus } from "@/lib/use-dialog-focus";
import type { BloodComponent, BloodGroup, InventoryItem, StockHealth } from "@/types/domain";

export function InventoryTable() {
  const [items, setItems] = useState(initialInventory);
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState<"ALL" | BloodGroup>("ALL");
  const [component, setComponent] = useState<"ALL" | BloodComponent>("ALL");
  const [health, setHealth] = useState<"ALL" | StockHealth>("ALL");
  const [editing, setEditing] = useState<InventoryItem | null>(null);
  const [available, setAvailable] = useState(0);
  const [reserved, setReserved] = useState(0);
  const [saving, setSaving] = useState(false);
  const closeDialog = useCallback(() => setEditing(null), []);
  const dialogRef = useDialogFocus(Boolean(editing), closeDialog);
  const rows = useMemo(
    () =>
      items.filter(
        (item) =>
          `${formatBloodGroup(item.bloodGroup)} ${formatComponent(item.component)}`
            .toLowerCase()
            .includes(query.toLowerCase()) &&
          (group === "ALL" || item.bloodGroup === group) &&
          (component === "ALL" || item.component === component) &&
          (health === "ALL" || getStockHealth(getFreeUnits(item)) === health),
      ),
    [items, query, group, component, health],
  );
  function open(item: InventoryItem) {
    setEditing(item);
    setAvailable(item.availableUnits);
    setReserved(item.reservedUnits);
  }
  function save() {
    if (!editing) return;
    setSaving(true);
    window.setTimeout(() => {
      setItems((current) =>
        current.map((item) =>
          item.id === editing.id
            ? {
                ...item,
                availableUnits: Math.max(0, available),
                reservedUnits: Math.min(Math.max(0, reserved), Math.max(0, available)),
                lastUpdated: "Just now",
              }
            : item,
        ),
      );
      setSaving(false);
      setEditing(null);
    }, 550);
  }
  return (
    <>
      <div className="inventory-summary-strip">
        <div>
          <span>Total available</span>
          <strong>{items.reduce((s, i) => s + i.availableUnits, 0)} units</strong>
        </div>
        <div>
          <span>Reserved</span>
          <strong>{items.reduce((s, i) => s + i.reservedUnits, 0)} units</strong>
        </div>
        <div>
          <span>Free inventory</span>
          <strong>{items.reduce((s, i) => s + getFreeUnits(i), 0)} units</strong>
        </div>
        <div>
          <span>Stock alerts</span>
          <strong>
            {
              items.filter((i) => ["LOW", "CRITICAL"].includes(getStockHealth(getFreeUnits(i))))
                .length
            }{" "}
            items
          </strong>
        </div>
      </div>
      <div id="inventory-table" className="panel table-panel">
        <div className="toolbar">
          <label className="search-field">
            <Search size={15} />
            <input
              placeholder="Search blood group or component"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <select
            className="filter-select"
            value={group}
            onChange={(e) => setGroup(e.target.value as typeof group)}
          >
            <option value="ALL">All groups</option>
            {bloodGroups.map((v) => (
              <option key={v} value={v}>
                {formatBloodGroup(v)}
              </option>
            ))}
          </select>
          <select
            className="filter-select"
            value={component}
            onChange={(e) => setComponent(e.target.value as typeof component)}
          >
            <option value="ALL">All components</option>
            {bloodComponents.map((v) => (
              <option key={v} value={v}>
                {formatComponent(v)}
              </option>
            ))}
          </select>
          <select
            className="filter-select"
            value={health}
            onChange={(e) => setHealth(e.target.value as typeof health)}
          >
            <option value="ALL">All stock states</option>
            <option>HEALTHY</option>
            <option>MODERATE</option>
            <option>LOW</option>
            <option>CRITICAL</option>
          </select>
        </div>
        <TableShell>
          <thead>
            <tr>
              <th>Blood group</th>
              <th>Component</th>
              <th>
                Available <ArrowUpDown size={11} />
              </th>
              <th>Reserved</th>
              <th>Free</th>
              <th>Status</th>
              <th>Last updated</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item) => {
              const free = getFreeUnits(item);
              return (
                <tr key={item.id}>
                  <td>
                    <div className="table-blood">
                      <BloodBadge group={item.bloodGroup} />
                      <strong>{formatBloodGroup(item.bloodGroup)}</strong>
                    </div>
                  </td>
                  <td>{formatComponent(item.component)}</td>
                  <td>
                    <strong>{item.availableUnits}</strong> units
                  </td>
                  <td>{item.reservedUnits} units</td>
                  <td>
                    <strong>{free}</strong> units
                  </td>
                  <td>
                    <StockBadge health={getStockHealth(free)} />
                  </td>
                  <td>{item.lastUpdated}</td>
                  <td>
                    <Button size="sm" variant="secondary" onClick={() => open(item)}>
                      <Edit3 size={13} />
                      Update units
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </TableShell>
        <Pagination label={`Showing ${rows.length} inventory records`} />
      </div>
      {editing && (
        <div
          className="dialog-backdrop"
          onMouseDown={() => {
            if (!saving) setEditing(null);
          }}
        >
          <div
            ref={dialogRef}
            className="dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-stock"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="dialog-head">
              <span className="dialog-icon">
                <BloodBadge group={editing.bloodGroup} />
              </span>
              <button
                className="icon-button"
                onClick={() => setEditing(null)}
                aria-label="Close"
                disabled={saving}
              >
                <X size={17} />
              </button>
            </div>
            <h2 id="edit-stock">
              Update {formatBloodGroup(editing.bloodGroup)} {formatComponent(editing.component)}
            </h2>
            <p>
              Adjust screened units and reservations. Free availability is calculated automatically.
            </p>
            <div className="field-grid dialog-fields">
              <div className="field">
                <label htmlFor="available">Available units</label>
                <input
                  id="available"
                  type="number"
                  min="0"
                  value={available}
                  onChange={(e) => setAvailable(Number(e.target.value))}
                />
              </div>
              <div className="field">
                <label htmlFor="reserved">Reserved units</label>
                <input
                  id="reserved"
                  type="number"
                  min="0"
                  max={available}
                  value={reserved}
                  onChange={(e) => setReserved(Number(e.target.value))}
                />
              </div>
            </div>
            <div className="calculated-free">
              <span>Calculated free stock</span>
              <strong>{Math.max(0, available - reserved)} units</strong>
            </div>
            <div className="dialog-actions">
              <Button variant="secondary" onClick={() => setEditing(null)} disabled={saving}>
                Cancel
              </Button>
              <Button isLoading={saving} loadingText="Saving inventory…" onClick={save}>
                Save inventory
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
