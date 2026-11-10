/** Filterable inventory table with a server-backed available-unit editor. */

"use client";

import { useActionState, useCallback, useMemo, useState } from "react";
import { CheckCircle2, Edit3, Search, X } from "lucide-react";

import { updateInventoryAction } from "@/app/actions/provider";
import {
  BloodBadge,
  Button,
  EmptyState,
  Pagination,
  StockBadge,
  TableShell,
} from "@/components/ui/core";
import {
  bloodComponents,
  bloodGroups,
  formatBloodGroup,
  formatComponent,
  getFreeUnits,
  getStockHealth,
} from "@/lib/domain";
import { initialInventoryActionState } from "@/lib/requests/provider-action-state";
import { useDialogFocus } from "@/lib/use-dialog-focus";
import type { BloodComponent, BloodGroup, InventoryItem, StockHealth } from "@/types/domain";

export function InventoryTable({ items }: { items: InventoryItem[] }) {
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState<"ALL" | BloodGroup>("ALL");
  const [component, setComponent] = useState<"ALL" | BloodComponent>("ALL");
  const [health, setHealth] = useState<"ALL" | StockHealth>("ALL");
  const [editing, setEditing] = useState<InventoryItem | null>(null);
  const [available, setAvailable] = useState(0);
  const [dismissedCompletion, setDismissedCompletion] = useState<number>();
  const [state, formAction, isPending] = useActionState(
    updateInventoryAction,
    initialInventoryActionState,
  );

  const closeDialog = useCallback(() => setEditing(null), []);
  const dialogRef = useDialogFocus<HTMLFormElement>(Boolean(editing), closeDialog);

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

  const totals = items.reduce(
    (summary, item) => ({
      available: summary.available + item.availableUnits,
      reserved: summary.reserved + item.reservedUnits,
      free: summary.free + getFreeUnits(item),
    }),
    { available: 0, reserved: 0, free: 0 },
  );
  const alertCount = items.filter((item) =>
    ["LOW", "CRITICAL"].includes(getStockHealth(getFreeUnits(item))),
  ).length;
  const successVisible = state.successMessage && state.completedAt !== dismissedCompletion;
  const dialogResultApplies = Boolean(
    state.completedAt && state.completedAt !== dismissedCompletion,
  );

  function open(item: InventoryItem) {
    // A result from the previous editor must not leak into a newly opened row.
    setDismissedCompletion(state.completedAt);
    setEditing(item);
    setAvailable(item.availableUnits);
  }

  return (
    <div className="space-y-6">
      {successVisible && (
        <div
          className="p-4 rounded-2xl bg-success-soft border border-success/30 flex items-center justify-between gap-3 text-xs text-emerald-800"
          role="status"
        >
          <span className="inline-flex items-center gap-2 font-semibold">
            <CheckCircle2 size={16} /> {state.successMessage}
          </span>
          <button
            type="button"
            onClick={() => setDismissedCompletion(state.completedAt)}
            aria-label="Dismiss notice"
          >
            <X size={15} />
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <InventoryMetric
          label="Total screened available"
          value={totals.available}
          detail="units in stock"
        />
        <InventoryMetric
          label="Committed and reserved"
          value={totals.reserved}
          detail="active allocations"
          tone="text-amber-600"
        />
        <InventoryMetric
          label="Unassigned free inventory"
          value={totals.free}
          detail="ready for dispatch"
          tone="text-emerald-600"
        />
        <InventoryMetric
          label="Critical stock deficits"
          value={alertCount}
          detail="rows below threshold"
          tone="text-critical"
        />
      </div>

      <div
        id="inventory-table"
        className="p-6 rounded-3xl bg-white border border-border shadow-sm space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 pb-2">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <input
              aria-label="Search inventory"
              placeholder="Search blood group or component type…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-xl border border-border bg-surface-muted text-xs font-medium text-ink placeholder:text-muted focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={group}
              onChange={(event) => setGroup(event.target.value as typeof group)}
              aria-label="Filter by blood group"
              className="h-10 px-3 rounded-xl border border-border bg-surface-muted text-xs font-semibold text-slate-700 focus:outline-none focus:border-brand cursor-pointer"
            >
              <option value="ALL">All Blood Groups</option>
              {bloodGroups.map((value) => (
                <option key={value} value={value}>
                  Group {formatBloodGroup(value)}
                </option>
              ))}
            </select>

            <select
              value={component}
              onChange={(event) => setComponent(event.target.value as typeof component)}
              aria-label="Filter by component"
              className="h-10 px-3 rounded-xl border border-border bg-surface-muted text-xs font-semibold text-slate-700 focus:outline-none focus:border-brand cursor-pointer"
            >
              <option value="ALL">All Components</option>
              {bloodComponents.map((value) => (
                <option key={value} value={value}>
                  {formatComponent(value)}
                </option>
              ))}
            </select>

            <select
              value={health}
              onChange={(event) => setHealth(event.target.value as typeof health)}
              aria-label="Filter by stock health"
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

        {items.length === 0 ? (
          <EmptyState
            title="No inventory rows available"
            description="Inventory seeded for this blood bank will appear here."
          />
        ) : rows.length === 0 ? (
          <EmptyState
            title="No inventory matches these filters"
            description="Adjust the search or stock filters to show other rows."
          />
        ) : (
          <>
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
                        {item.availableUnits} units
                      </td>
                      <td className="py-3.5 px-4 text-amber-700 font-semibold tabular-nums">
                        {item.reservedUnits} units
                      </td>
                      <td className="py-3.5 px-4 font-bold text-emerald-700 tabular-nums">
                        {free} units
                      </td>
                      <td className="py-3.5 px-4">
                        <StockBadge health={getStockHealth(free)} />
                      </td>
                      <td className="py-3.5 px-4 text-muted text-[11.5px]">{item.lastUpdated}</td>
                      <td className="py-3.5 px-4 text-right">
                        <Button size="sm" variant="secondary" onClick={() => open(item)}>
                          <Edit3 size={13} /> Update units
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </TableShell>
            <Pagination label={`Showing ${rows.length} of ${items.length} inventory records`} />
          </>
        )}
      </div>

      {editing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150"
          role="presentation"
          onMouseDown={() => {
            if (!isPending) closeDialog();
          }}
        >
          <form
            action={formAction}
            ref={dialogRef}
            className="w-full max-w-md bg-white border border-border rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-stock-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <input type="hidden" name="inventoryId" value={editing.id} />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BloodBadge group={editing.bloodGroup} large />
                <div>
                  <h2 id="edit-stock-title" className="text-base font-bold text-ink">
                    Update {formatBloodGroup(editing.bloodGroup)}{" "}
                    {formatComponent(editing.component)}
                  </h2>
                  <p className="text-xs text-muted mt-0.5">Adjust screened available units</p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeDialog}
                aria-label="Close dialog"
                disabled={isPending}
                className="w-8 h-8 rounded-full border border-border grid place-items-center text-muted hover:text-ink hover:bg-surface-muted transition-colors"
              >
                <X size={15} />
              </button>
            </div>

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
                  name="unitsAvailable"
                  type="number"
                  min="0"
                  step="1"
                  required
                  value={available}
                  onChange={(event) => setAvailable(Number(event.target.value))}
                  readOnly={isPending}
                  aria-invalid={Boolean(state.fieldErrors?.unitsAvailable?.length)}
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
                  value={editing.reservedUnits}
                  readOnly
                  aria-readonly="true"
                  className="w-full h-11 px-3 rounded-xl border border-border bg-surface-muted text-xs font-bold text-amber-700"
                />
              </div>
            </div>

            <p className="text-[11px] text-muted">
              Reserved units are lifecycle-controlled and cannot be edited manually.
            </p>
            {dialogResultApplies && state.fieldErrors?.unitsAvailable?.[0] && (
              <p className="text-[11px] text-critical" role="alert">
                {state.fieldErrors.unitsAvailable[0]}
              </p>
            )}
            {dialogResultApplies && state.message && (
              <p
                className="rounded-xl border border-critical/25 bg-critical-soft px-3 py-2 text-[11px] text-critical"
                role="alert"
              >
                {state.message}
              </p>
            )}

            <div className="p-3.5 rounded-xl bg-surface-muted border border-border flex items-center justify-between text-xs">
              <span className="font-medium text-slate-600">Calculated free stock:</span>
              <strong className="text-sm font-bold text-emerald-600">
                {Math.max(0, available - editing.reservedUnits)} units
              </strong>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
              {dialogResultApplies && state.successMessage ? (
                <Button type="button" onClick={closeDialog}>
                  Done
                </Button>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={closeDialog}
                    disabled={isPending}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" isLoading={isPending} loadingText="Updating stock…">
                    Save inventory
                  </Button>
                </>
              )}
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function InventoryMetric({
  label,
  value,
  detail,
  tone = "text-ink",
}: {
  label: string;
  value: number;
  detail: string;
  tone?: string;
}) {
  return (
    <div className="p-4 rounded-2xl bg-white border border-border shadow-sm">
      <span className="text-xs font-medium text-muted block">{label}</span>
      <div className="flex items-baseline gap-2 mt-1">
        <strong className={`text-2xl font-bold tabular-nums ${tone}`}>{value}</strong>
        <span className="text-xs text-muted">{detail}</span>
      </div>
    </div>
  );
}
