"use client";

import { useCallback, useMemo, useState } from "react";
import { Edit3, Search, X } from "lucide-react";
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
    }, 450);
  }

  const totalAvailable = items.reduce((s, i) => s + i.availableUnits, 0);
  const totalReserved = items.reduce((s, i) => s + i.reservedUnits, 0);
  const totalFree = items.reduce((s, i) => s + getFreeUnits(i), 0);
  const alertCount = items.filter((i) =>
    ["LOW", "CRITICAL"].includes(getStockHealth(getFreeUnits(i))),
  ).length;

  return (
    <div className="space-y-6">
      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-white border border-border shadow-sm">
          <span className="text-xs font-medium text-muted block">Total Screened Available</span>
          <div className="flex items-baseline gap-2 mt-1">
            <strong className="text-2xl font-bold text-ink tabular-nums">{totalAvailable}</strong>
            <span className="text-xs text-muted">units in stock</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-border shadow-sm">
          <span className="text-xs font-medium text-muted block">Committed & Reserved</span>
          <div className="flex items-baseline gap-2 mt-1">
            <strong className="text-2xl font-bold text-amber-600 tabular-nums">
              {totalReserved}
            </strong>
            <span className="text-xs text-muted">active allocations</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-border shadow-sm">
          <span className="text-xs font-medium text-muted block">Unassigned Free Inventory</span>
          <div className="flex items-baseline gap-2 mt-1">
            <strong className="text-2xl font-bold text-emerald-600 tabular-nums">
              {totalFree}
            </strong>
            <span className="text-xs text-muted">ready for dispatch</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-border shadow-sm">
          <span className="text-xs font-medium text-muted block">Critical Stock Deficits</span>
          <div className="flex items-baseline gap-2 mt-1">
            <strong className="text-2xl font-bold text-critical tabular-nums">{alertCount}</strong>
            <span className="text-xs text-muted">groups below threshold</span>
          </div>
        </div>
      </div>

      {/* Main Inventory Data Matrix */}
      <div
        id="inventory-table"
        className="p-6 rounded-3xl bg-white border border-border shadow-sm space-y-4"
      >
        {/* Toolbar & Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-2">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <input
              placeholder="Search blood group or component type…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-xl border border-border bg-surface-muted text-xs font-medium text-ink placeholder:text-muted focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={group}
              onChange={(e) => setGroup(e.target.value as typeof group)}
              className="h-10 px-3 rounded-xl border border-border bg-surface-muted text-xs font-semibold text-slate-700 focus:outline-none focus:border-brand cursor-pointer"
            >
              <option value="ALL">All Blood Groups</option>
              {bloodGroups.map((v) => (
                <option key={v} value={v}>
                  Group {formatBloodGroup(v)}
                </option>
              ))}
            </select>

            <select
              value={component}
              onChange={(e) => setComponent(e.target.value as typeof component)}
              className="h-10 px-3 rounded-xl border border-border bg-surface-muted text-xs font-semibold text-slate-700 focus:outline-none focus:border-brand cursor-pointer"
            >
              <option value="ALL">All Components</option>
              {bloodComponents.map((v) => (
                <option key={v} value={v}>
                  {formatComponent(v)}
                </option>
              ))}
            </select>

            <select
              value={health}
              onChange={(e) => setHealth(e.target.value as typeof health)}
              className="h-10 px-3 rounded-xl border border-border bg-surface-muted text-xs font-semibold text-slate-700 focus:outline-none focus:border-brand cursor-pointer"
            >
              <option value="ALL">All Stock States</option>
              <option value="HEALTHY">Healthy Reserves</option>
              <option value="MODERATE">Moderate Levels</option>
              <option value="LOW">Low Reserves</option>
              <option value="CRITICAL">Critical Shortage</option>
            </select>
          </div>
        </div>

        {/* Table View */}
        <TableShell>
          <thead>
            <tr className="border-b border-border text-[11.5px] font-semibold text-muted uppercase tracking-wider text-left">
              <th className="py-3 px-4">Blood Group</th>
              <th className="py-3 px-4">Component</th>
              <th className="py-3 px-4">Available</th>
              <th className="py-3 px-4">Reserved</th>
              <th className="py-3 px-4">Free Available</th>
              <th className="py-3 px-4">Stock Status</th>
              <th className="py-3 px-4">Last Sync</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-xs">
            {rows.map((item) => {
              const free = getFreeUnits(item);
              return (
                <tr key={item.id} className="hover:bg-surface-muted/50 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <BloodBadge group={item.bloodGroup} />
                      <strong className="font-bold text-ink text-[13px]">
                        {formatBloodGroup(item.bloodGroup)}
                      </strong>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-medium text-slate-700">
                    {formatComponent(item.component)}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-ink tabular-nums">
                    {item.availableUnits}{" "}
                    <span className="text-muted font-normal text-[11px]">units</span>
                  </td>
                  <td className="py-3.5 px-4 text-amber-700 font-semibold tabular-nums">
                    {item.reservedUnits}{" "}
                    <span className="text-muted font-normal text-[11px]">units</span>
                  </td>
                  <td className="py-3.5 px-4 font-bold text-emerald-700 tabular-nums">
                    {free} <span className="text-muted font-normal text-[11px]">units</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <StockBadge health={getStockHealth(free)} />
                  </td>
                  <td className="py-3.5 px-4 text-muted text-[11.5px]">{item.lastUpdated}</td>
                  <td className="py-3.5 px-4 text-right">
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

        <Pagination label={`Showing ${rows.length} screened blood inventory records`} />
      </div>

      {/* Edit Inventory Modal Dialog */}
      {editing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150"
          onMouseDown={() => {
            if (!saving) setEditing(null);
          }}
        >
          <div
            ref={dialogRef}
            className="w-full max-w-md bg-white border border-border rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-stock"
            onMouseDown={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BloodBadge group={editing.bloodGroup} large />
                <div>
                  <h2 id="edit-stock" className="text-base font-bold text-ink">
                    Update {formatBloodGroup(editing.bloodGroup)}{" "}
                    {formatComponent(editing.component)}
                  </h2>
                  <p className="text-xs text-muted mt-0.5">
                    Adjust screened units and committed reserves
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditing(null)}
                aria-label="Close dialog"
                disabled={saving}
                className="w-8 h-8 rounded-full border border-border grid place-items-center text-muted hover:text-ink hover:bg-surface-muted transition-colors"
              >
                <X size={15} />
              </button>
            </div>

            {/* Inputs */}
            <div className="grid grid-cols-2 gap-3.5 pt-2">
              <div>
                <label
                  htmlFor="available"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Available Units
                </label>
                <input
                  id="available"
                  type="number"
                  min="0"
                  value={available}
                  onChange={(e) => setAvailable(Number(e.target.value))}
                  className="w-full h-11 px-3 rounded-xl border border-border-strong text-xs font-bold text-ink focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                />
              </div>

              <div>
                <label
                  htmlFor="reserved"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Reserved Units
                </label>
                <input
                  id="reserved"
                  type="number"
                  min="0"
                  max={available}
                  value={reserved}
                  onChange={(e) => setReserved(Number(e.target.value))}
                  className="w-full h-11 px-3 rounded-xl border border-border-strong text-xs font-bold text-amber-700 focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                />
              </div>
            </div>

            {/* Live Calculation Banner */}
            <div className="p-3.5 rounded-xl bg-surface-muted border border-border flex items-center justify-between text-xs">
              <span className="font-medium text-slate-600">
                Calculated free stock for dispatch:
              </span>
              <strong className="text-sm font-bold text-emerald-600">
                {Math.max(0, available - reserved)} units
              </strong>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
              <Button variant="secondary" onClick={() => setEditing(null)} disabled={saving}>
                Cancel
              </Button>
              <Button isLoading={saving} loadingText="Updating stock…" onClick={save}>
                Save inventory
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
