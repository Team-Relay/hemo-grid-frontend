"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Check, Minus, Plus, Search, ShieldAlert } from "lucide-react";
import { createBloodRequestAction } from "@/app/actions/blood-requests";
import {
  bloodComponents,
  bloodGroups,
  formatBloodGroup,
  formatComponent,
  formatUrgency,
} from "@/lib/domain";
import type { BloodComponent, BloodGroup, RequestUrgency } from "@/types/domain";
import { Button, cn, PageHeader, Panel } from "@/components/ui/core";
import { initialRequestFormState } from "@/lib/requests/action-state";

const urgencies: RequestUrgency[] = ["ROUTINE", "URGENT", "CRITICAL"];

export function RequestForm() {
  const router = useRouter();
  const [group, setGroup] = useState<BloodGroup>("O_NEGATIVE");
  const [component, setComponent] = useState<BloodComponent>("RED_CELLS");
  const [units, setUnits] = useState(3);
  const [urgency, setUrgency] = useState<RequestUrgency>("CRITICAL");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [leaving, setLeaving] = useState(false);
  const [state, formAction, isPending] = useActionState(
    createBloodRequestAction,
    initialRequestFormState,
  );

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        backHref="/hospital/requests"
        eyebrow="Emergency Fulfilment"
        title="Create blood request"
        description="Enter the exact blood group and component required. HemoGrid will instantly calculate matching network inventory and travel distance."
      />

      <form action={formAction} className="space-y-6" noValidate>
        <input type="hidden" name="bloodGroup" value={group} />
        <input type="hidden" name="component" value={component} />
        <input type="hidden" name="unitsRequired" value={units} />
        <input type="hidden" name="urgency" value={urgency} />
        <Panel className="p-6 sm:p-8 space-y-8 shadow-sm">
          {/* Section 1: Blood Group Selection */}
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-bold text-ink tracking-tight">1. Target Blood Group</h2>
              <p className="text-xs text-muted mt-0.5">
                Select the exact group requested. Cross-match compatibility protocols will search
                exact screened units.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {bloodGroups.map((value) => {
                const isSelected = value === group;
                const isPositive = value.includes("POSITIVE");
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setGroup(value)}
                    disabled={isPending || leaving}
                    className={cn(
                      "p-3.5 rounded-2xl border text-left transition-all duration-150 relative flex items-center justify-between",
                      isSelected
                        ? "bg-brand-soft border-brand text-brand-dark shadow-[0_2px_8px_rgba(108,92,231,0.12)] ring-1 ring-brand"
                        : "bg-surface-muted border-border text-slate-700 hover:border-border-strong hover:bg-white",
                    )}
                  >
                    <div>
                      <strong className="block text-base font-bold tracking-tight">
                        {formatBloodGroup(value)}
                      </strong>
                      <span className="text-[10.5px] text-muted font-medium">
                        {isPositive ? "Rh Positive (+)" : "Rh Negative (−)"}
                      </span>
                    </div>
                    {isSelected && (
                      <span className="w-5 h-5 rounded-full bg-brand text-white grid place-items-center shrink-0 shadow-sm">
                        <Check size={11} strokeWidth={3} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <hr className="border-border" />

          {/* Section 2: Blood Component */}
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-bold text-ink tracking-tight">
                2. Component Requirement
              </h2>
              <p className="text-xs text-muted mt-0.5">
                Inventory matching uses the exact selected component preparation.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {bloodComponents.map((value) => {
                const isSelected = value === component;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setComponent(value)}
                    disabled={isPending || leaving}
                    className={cn(
                      "p-3.5 rounded-2xl border text-left transition-all duration-150 relative flex items-center justify-between",
                      isSelected
                        ? "bg-brand-soft border-brand text-brand-dark shadow-[0_2px_8px_rgba(108,92,231,0.12)] ring-1 ring-brand"
                        : "bg-surface-muted border-border text-slate-700 hover:border-border-strong hover:bg-white",
                    )}
                  >
                    <div>
                      <strong className="block text-xs sm:text-[13px] font-bold tracking-tight">
                        {formatComponent(value)}
                      </strong>
                      <span className="text-[10.5px] text-muted font-medium">Screened Stock</span>
                    </div>
                    {isSelected && (
                      <span className="w-5 h-5 rounded-full bg-brand text-white grid place-items-center shrink-0 shadow-sm">
                        <Check size={11} strokeWidth={3} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <hr className="border-border" />

          {/* Section 3: Quantity & Urgency */}
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-bold text-ink tracking-tight">
                3. Units & Priority Level
              </h2>
              <p className="text-xs text-muted mt-0.5">
                Specify the required quantity and urgency for regional dispatch routing.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-start">
              {/* Units Stepper */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Units Required (Bags)
                </label>
                <div className="flex items-center gap-3">
                  <div className="flex items-center border border-border-strong rounded-2xl bg-white p-1 shadow-sm">
                    <button
                      type="button"
                      onClick={() => setUnits(Math.max(1, units - 1))}
                      disabled={isPending || leaving}
                      aria-label="Decrease units"
                      className="w-10 h-10 rounded-xl grid place-items-center text-slate-600 hover:bg-surface-muted hover:text-ink transition-colors"
                    >
                      <Minus size={16} />
                    </button>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={units}
                      onChange={(e) => setUnits(Math.min(20, Math.max(1, Number(e.target.value))))}
                      readOnly={isPending || leaving}
                      aria-invalid={Boolean(state.fieldErrors?.unitsRequired?.length)}
                      aria-label="Units required"
                      className="w-16 h-10 text-center font-bold text-lg text-ink focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <button
                      type="button"
                      onClick={() => setUnits(units + 1)}
                      disabled={isPending || leaving || units >= 20}
                      aria-label="Increase units"
                      className="w-10 h-10 rounded-xl grid place-items-center text-slate-600 hover:bg-surface-muted hover:text-ink transition-colors"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  <span className="text-xs text-muted">Minimum 1 unit</span>
                </div>
                {state.fieldErrors?.unitsRequired?.[0] && (
                  <p className="mt-2 text-[10.5px] text-critical" role="alert">
                    {state.fieldErrors.unitsRequired[0]}
                  </p>
                )}
              </div>

              {/* Urgency Choices */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Operational Urgency
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {urgencies.map((value) => {
                    const isSelected = value === urgency;
                    const isCritical = value === "CRITICAL";
                    const isUrgent = value === "URGENT";
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setUrgency(value)}
                        disabled={isPending || leaving}
                        className={cn(
                          "h-11 px-3 rounded-xl border text-xs font-bold transition-all duration-150 flex items-center justify-center gap-1.5",
                          isSelected
                            ? isCritical
                              ? "bg-critical text-white border-critical shadow-sm"
                              : isUrgent
                                ? "bg-amber-600 text-white border-amber-600 shadow-sm"
                                : "bg-ink text-white border-ink shadow-sm"
                            : "bg-surface-muted border-border text-slate-700 hover:bg-white hover:border-border-strong",
                        )}
                      >
                        {isCritical && <ShieldAlert size={13} />}
                        {formatUrgency(value)}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <hr className="border-border" />

          {/* Section 4: Context & Reference */}
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-bold text-ink tracking-tight">
                4. Clinical & Logistics Context
              </h2>
              <p className="text-xs text-muted mt-0.5">
                Internal reference identifiers for your emergency department and dispatchers.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="clinical-ref"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Clinical Reference / ER Ticket{" "}
                  <span className="text-muted font-normal">(optional)</span>
                </label>
                <input
                  id="clinical-ref"
                  name="clinicalReference"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  readOnly={isPending || leaving}
                  maxLength={120}
                  aria-invalid={Boolean(state.fieldErrors?.clinicalReference?.length)}
                  placeholder="e.g. ER-88219"
                  className="w-full h-11 px-4 rounded-xl border border-border-strong bg-white text-xs font-medium text-ink placeholder:text-muted focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all"
                />
                {state.fieldErrors?.clinicalReference?.[0] && (
                  <p className="mt-1 text-[10.5px] text-critical" role="alert">
                    {state.fieldErrors.clinicalReference[0]}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="notes"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Operational Notes <span className="text-muted font-normal">(optional)</span>
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  readOnly={isPending || leaving}
                  placeholder="e.g. Urgent surgery scheduled at 17:00, cold-chain box required"
                  maxLength={2000}
                  rows={2}
                  aria-invalid={Boolean(state.fieldErrors?.notes?.length)}
                  className="w-full p-3 rounded-xl border border-border-strong bg-white text-xs font-medium text-ink placeholder:text-muted focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all resize-none"
                />
                <span className="text-[10.5px] text-muted block text-right mt-1">
                  {notes.length}/2,000 characters
                </span>
                {state.fieldErrors?.notes?.[0] && (
                  <p className="mt-1 text-[10.5px] text-critical" role="alert">
                    {state.fieldErrors.notes[0]}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Summary Alert Banner */}
          <div className="p-4 rounded-2xl bg-brand-soft/70 border border-brand/20 flex items-start gap-3 text-xs">
            <AlertCircle size={18} className="text-brand shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold text-brand-dark block text-xs">
                Request Validation Summary
              </strong>
              <p className="text-slate-700 text-[11.5px] mt-0.5 leading-relaxed">
                Searching for{" "}
                <strong>
                  {units} unit{units === 1 ? "" : "s"}
                </strong>{" "}
                of <strong>{formatBloodGroup(group)}</strong> ({formatComponent(component)}) with{" "}
                <strong>{formatUrgency(urgency)}</strong> dispatch status. Real-time corridor
                routing will evaluate currently eligible blood banks for immediate supply.
              </p>
            </div>
          </div>

          {state.message && (
            <div
              className="rounded-xl border border-critical/25 bg-critical-soft px-4 py-3 text-[11.5px] text-critical"
              role="alert"
            >
              {state.message}
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="secondary"
              isLoading={leaving}
              loadingText="Going back…"
              disabled={isPending}
              onClick={() => {
                setLeaving(true);
                router.back();
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={isPending}
              loadingText="Matching network inventory…"
              disabled={leaving}
            >
              <Search size={15} />
              Create &amp; find matches
            </Button>
          </div>
        </Panel>
      </form>
    </div>
  );
}
