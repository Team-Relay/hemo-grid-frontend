/** Multi-step hospital request form backed directly by the Spring Boot API. */

"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Check, Minus, Plus, Search, ShieldAlert } from "lucide-react";
import { z } from "zod";

import { revalidateHospitalRequestsAction } from "@/app/actions/blood-requests";
import {
  Button,
  cn,
  FeedbackBanner,
  FieldError,
  PageHeader,
  Panel,
} from "@/components/ui/core";
import { createBloodRequest } from "@/lib/api/blood-requests";
import { ApiClientError } from "@/lib/api/errors";
import { clearClientSessionCookie, getClientAccessToken } from "@/lib/auth/client-session";
import {
  bloodComponents,
  bloodGroups,
  formatBloodGroup,
  formatComponent,
  formatUrgency,
} from "@/lib/domain";
import {
  initialRequestFormState,
  type RequestFormActionState,
} from "@/lib/requests/action-state";
import { createBloodRequestSchema } from "@/lib/validation/blood-request";
import type { BloodComponent, BloodGroup, RequestUrgency } from "@/types/domain";

const urgencies: RequestUrgency[] = ["ROUTINE", "URGENT", "CRITICAL"];
const UNKNOWN_PROTOCOL_PREFIX = "[EMERGENCY UNKNOWN BLOOD GROUP — UNIVERSAL O− PROTOCOL]";

function isRequestField(
  field: string,
): field is keyof NonNullable<RequestFormActionState["fieldErrors"]> {
  return [
    "bloodGroup",
    "component",
    "unitsRequired",
    "urgency",
    "clinicalReference",
    "notes",
  ].includes(field);
}

function requestErrorMessage(error: ApiClientError): string {
  if (error.status === 403) return "Your account cannot perform this hospital action.";
  if (error.status === 404) return "This request or provider is no longer available.";
  if (error.status === 409) return error.message;
  return error.message;
}

export function RequestForm() {
  const router = useRouter();
  const [group, setGroup] = useState<BloodGroup>("O_NEGATIVE");
  const [component, setComponent] = useState<BloodComponent>("RED_CELLS");
  const [units, setUnits] = useState(3);
  const [urgency, setUrgency] = useState<RequestUrgency>("CRITICAL");
  const [unknownBloodGroup, setUnknownBloodGroup] = useState(false);
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [leaving, setLeaving] = useState(false);
  const [state, setState] = useState<RequestFormActionState>(initialRequestFormState);
  const [isPending, setIsPending] = useState(false);

  function toggleUnknownProtocol(enabled: boolean) {
    setUnknownBloodGroup(enabled);
    if (enabled) {
      setGroup("O_NEGATIVE");
      setComponent("RED_CELLS");
      setUrgency("CRITICAL");
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isPending || leaving) return;

    const effectiveNotes =
      unknownBloodGroup && !notes.includes(UNKNOWN_PROTOCOL_PREFIX)
        ? `${UNKNOWN_PROTOCOL_PREFIX} ${notes}`.trim()
        : notes;

    const validated = createBloodRequestSchema.safeParse({
      bloodGroup: group,
      component,
      unitsRequired: units,
      urgency,
      clinicalReference: reference,
      notes: effectiveNotes,
    });

    if (!validated.success) {
      const fields = z.flattenError(validated.error).fieldErrors;
      setState({
        message: "Check the highlighted request details and try again.",
        fieldErrors: fields,
      });
      return;
    }

    const accessToken = getClientAccessToken();
    if (!accessToken) {
      router.replace("/login?reason=session-expired");
      return;
    }

    setIsPending(true);
    setState(initialRequestFormState);

    try {
      const created = await createBloodRequest(accessToken, validated.data);
      await revalidateHospitalRequestsAction(created.id);
      router.push(`/hospital/requests/${created.id}/matches`);
    } catch (error) {
      setIsPending(false);
      if (error instanceof ApiClientError) {
        if (error.status === 401) {
          clearClientSessionCookie();
          router.replace("/login?reason=session-expired");
          return;
        }
        const fieldErrors: NonNullable<RequestFormActionState["fieldErrors"]> = {};
        for (const fieldError of error.fieldErrors) {
          if (isRequestField(fieldError.field)) {
            fieldErrors[fieldError.field] = [
              ...(fieldErrors[fieldError.field] ?? []),
              fieldError.message,
            ];
          }
        }
        setState({ message: requestErrorMessage(error), fieldErrors });
        return;
      }

      setState({
        message: "HemoGrid could not reach the server. Check your connection and try again.",
      });
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        backHref="/hospital/requests"
        eyebrow="Emergency Fulfilment"
        title="Create blood request"
        description="Enter the exact blood group and component required. HemoGrid evaluates ABO/Rh compatibility, Universal O− conservation rules, cold-chain integrity, and road-corridor transit ETA."
      />

      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        <input type="hidden" name="bloodGroup" value={group} />
        <input type="hidden" name="component" value={component} />
        <input type="hidden" name="unitsRequired" value={units} />
        <input type="hidden" name="urgency" value={urgency} />
        <Panel className="p-6 sm:p-8 space-y-8 shadow-sm">
          {/* Section 1: Blood Group Selection */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-ink tracking-tight">
                  1. Target Blood Group
                </h2>
                <p className="text-xs text-muted mt-0.5">
                  Select the exact patient group or activate the Emergency Unknown Blood Group
                  trauma protocol.
                </p>
              </div>

              <button
                type="button"
                onClick={() => toggleUnknownProtocol(!unknownBloodGroup)}
                disabled={isPending || leaving}
                aria-pressed={unknownBloodGroup}
                className={cn(
                  "inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-semibold transition-all",
                  unknownBloodGroup
                    ? "bg-amber-600 text-white border-amber-600 shadow-sm"
                    : "bg-surface-muted border-border text-slate-700 hover:bg-white hover:border-border-strong",
                )}
              >
                <ShieldAlert size={14} />
                {unknownBloodGroup
                  ? "Universal O− Trauma Protocol Active"
                  : "Patient blood group unknown (Trauma O−)"}
              </button>
            </div>

            {unknownBloodGroup && (
              <FeedbackBanner
                tone="warning"
                title="Emergency Unknown Blood Group — Universal O− Protocol"
                message="Unidentified trauma & obstetric hemorrhage protocol activated: HemoGrid locks O− Red Cells with CRITICAL dispatch priority and restricts candidate ranking to cold-chain verified O− reserves."
              />
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {bloodGroups.map((value) => {
                const isSelected = value === group;
                const isPositive = value.includes("POSITIVE");
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      if (unknownBloodGroup && value !== "O_NEGATIVE") {
                        setUnknownBloodGroup(false);
                      }
                      setGroup(value);
                    }}
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
                Inventory matching uses the exact selected component preparation and cold-chain
                storage profile.
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
                <FieldError message={state.fieldErrors?.unitsRequired?.[0]} />
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
                <FieldError message={state.fieldErrors?.clinicalReference?.[0]} />
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
                <FieldError message={state.fieldErrors?.notes?.[0]} />
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
                routing will evaluate currently eligible blood banks, cold-chain telemetry, and
                Universal O− conservation rules.
              </p>
            </div>
          </div>

          {state.message && (
            <FeedbackBanner
              tone="critical"
              title="Unable to create request"
              message={state.message}
            />
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
