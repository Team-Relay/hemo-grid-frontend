/** Multi-step hospital request form backed directly by the Spring Boot API. */

"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  AlertTriangle,
  Building,
  Check,
  MapPin,
  Minus,
  Plus,
  Search,
  ShieldAlert,
} from "lucide-react";
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

interface SpecialPrepOption {
  id: string;
  label: string;
  baseComponent: BloodComponent | null;
  coldChainTag: string;
  description: string;
}

const specialPreps: SpecialPrepOption[] = [
  {
    id: "STANDARD",
    label: "Standard Unmodified Component",
    baseComponent: null,
    coldChainTag: "Standard protocol",
    description: "Standard screened and cold-chain verified bag",
  },
  {
    id: "FFP",
    label: "Fresh Frozen Plasma (FFP)",
    baseComponent: "PLASMA",
    coldChainTag: "≤ −18°C frozen",
    description: "High-yield coagulation factors for massive hemorrhage or coagulopathy",
  },
  {
    id: "CRYO",
    label: "Cryoprecipitate Antihemophilic Factor (AHF)",
    baseComponent: "PLASMA",
    coldChainTag: "≤ −18°C frozen",
    description: "Fibrinogen and Factor VIII rich fraction for massive bleeding or DIC",
  },
  {
    id: "WASHED_RBC",
    label: "Washed Red Blood Cells",
    baseComponent: "RED_CELLS",
    coldChainTag: "2°C–6°C verified",
    description: "Saline-washed to eliminate donor plasma proteins and prevent allergic reactions",
  },
  {
    id: "IRRADIATED",
    label: "Irradiated Blood Component (25 Gy)",
    baseComponent: "RED_CELLS",
    coldChainTag: "2°C–6°C verified",
    description: "Gamma irradiation to prevent Transfusion-Associated Graft-versus-Host Disease",
  },
  {
    id: "PEDIATRIC",
    label: "Pediatric / Neonatal Quad-Pack",
    baseComponent: "RED_CELLS",
    coldChainTag: "2°C–6°C verified",
    description: "Volume-divided aliquots for neonatal exchange and infant resuscitation",
  },
  {
    id: "APHERESIS_PLT",
    label: "Apheresis Single-Donor Platelets (SDP)",
    baseComponent: "PLATELETS",
    coldChainTag: "20°C–24°C agitated",
    description: "Single-donor high-yield platelets minimizing donor antigen exposure",
  },
  {
    id: "OTHER",
    label: "Other Specialized Derivative",
    baseComponent: null,
    coldChainTag: "Custom specification",
    description: "Custom derivative or preparation specified in Clinical Context",
  },
];

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
  const [specialPrep, setSpecialPrep] = useState("STANDARD");
  const [units, setUnits] = useState(3);
  const [urgency, setUrgency] = useState<RequestUrgency>("CRITICAL");
  const [unknownBloodGroup, setUnknownBloodGroup] = useState(false);
  const [deliveryWard, setDeliveryWard] = useState("");
  const [hasTransfusionReaction, setHasTransfusionReaction] = useState(false);
  const [reactionDetails, setReactionDetails] = useState("");
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
      setSpecialPrep("STANDARD");
      setUrgency("CRITICAL");
    }
  }

  function handleSpecialPrepChange(selectedId: string) {
    setSpecialPrep(selectedId);
    const option = specialPreps.find((p) => p.id === selectedId);
    if (option?.baseComponent) {
      setComponent(option.baseComponent);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isPending || leaving) return;

    const clinicalSegments: string[] = [];

    if (unknownBloodGroup) {
      clinicalSegments.push(UNKNOWN_PROTOCOL_PREFIX);
    }

    if (deliveryWard.trim()) {
      clinicalSegments.push(`[DELIVERY POINT: ${deliveryWard.trim()}]`);
    }

    if (specialPrep !== "STANDARD") {
      const prepObj = specialPreps.find((p) => p.id === specialPrep);
      if (prepObj) {
        clinicalSegments.push(`[SPECIAL PREPARATION: ${prepObj.label}]`);
      }
    }

    if (hasTransfusionReaction) {
      const detail = reactionDetails.trim()
        ? reactionDetails.trim()
        : "Prior adverse reaction reported — extended antibody crossmatch required";
      clinicalSegments.push(`[ALERT - TRANSFUSION REACTION HISTORY: ${detail}]`);
    }

    if (notes.trim()) {
      clinicalSegments.push(`[CLINICAL CONTEXT: ${notes.trim()}]`);
    }

    const effectiveNotes = clinicalSegments.join("\n\n");

    const validated = createBloodRequestSchema.safeParse({
      bloodGroup: group,
      component,
      unitsRequired: units,
      urgency,
      clinicalReference: reference,
      notes: effectiveNotes.length > 0 ? effectiveNotes : undefined,
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
        description="Enter the exact blood group, component preparation, and point of care delivery. HemoGrid evaluates ABO/Rh compatibility, Universal O− preservation rules, cold-chain telemetry, and road transit ETA."
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
                  Select the patient ABO/Rh group or activate the Emergency Trauma Protocol.
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
                message="Unidentified trauma & obstetric hemorrhage protocol activated: HemoGrid locks O− Red Cells with CRITICAL priority and restricts candidate ranking to cold-chain verified O− reserves."
              />
            )}

            {/* Universal Buffer Preservation Protocol Callout */}
            {group === "O_NEGATIVE" && (
              <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs text-amber-950 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 font-bold text-amber-900">
                    <ShieldAlert size={15} className="text-amber-700 shrink-0" />
                    <span>Preservation of the Universal Buffer (O− Protocol)</span>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-200/70 text-amber-900">
                    National Strategic Reserve
                  </span>
                </div>
                <p className="text-[11.5px] leading-relaxed text-amber-900/90">
                  Universal O− units represent the national strategic emergency buffer for life-threatening trauma and uncrossmatched maternal hemorrhage. HemoGrid audits O− usage against regional inventory thresholds to prevent buffer exhaustion. Type-specific blood must be ordered whenever patient ABO/Rh is confirmed.
                </p>
                {urgency === "ROUTINE" && (
                  <div className="p-2.5 rounded-xl bg-white/80 border border-amber-300 text-[11px] font-medium text-amber-900 flex items-start gap-2">
                    <AlertTriangle size={14} className="text-amber-600 shrink-0 mt-0.5" />
                    <span>
                      <strong>Stewardship Notice:</strong> Routine priority selected for O− blood. Please confirm whether patient is verified O− negative, or select the patient&apos;s type-specific group to conserve the national universal reserve.
                    </span>
                  </div>
                )}
              </div>
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
                Select the base component and optional specialized derivative. Inventory matching verifies exact cold-chain storage parameters.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {bloodComponents.map((value) => {
                const isSelected = value === component;
                const coldTag =
                  value === "PLASMA"
                    ? "≤ −18°C"
                    : value === "PLATELETS"
                      ? "20°C–24°C"
                      : "2°C–6°C";
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      setComponent(value);
                      // Reset special prep if it doesn't align
                      const currentOption = specialPreps.find((p) => p.id === specialPrep);
                      if (currentOption?.baseComponent && currentOption.baseComponent !== value) {
                        setSpecialPrep("STANDARD");
                      }
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
                      <strong className="block text-xs sm:text-[13px] font-bold tracking-tight">
                        {formatComponent(value)}
                      </strong>
                      <span className="text-[10.5px] text-muted font-medium">
                        Cold gate: {coldTag}
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

            {/* Special Component Derivative / Preparation Dropdown */}
            <div className="p-4 rounded-2xl bg-surface-muted/60 border border-border space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label
                  htmlFor="special-prep-select"
                  className="text-xs font-bold text-ink flex items-center gap-1.5"
                >
                  <span>Special Component Derivative / Preparation</span>
                  <span className="text-muted font-normal text-[11px]">(Optional)</span>
                </label>
                <span className="text-[11px] font-semibold text-brand">
                  {specialPreps.find((p) => p.id === specialPrep)?.coldChainTag}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                <div className="sm:col-span-2">
                  <select
                    id="special-prep-select"
                    value={specialPrep}
                    onChange={(e) => handleSpecialPrepChange(e.target.value)}
                    disabled={isPending || leaving}
                    className="w-full h-10 px-3.5 rounded-xl border border-border-strong bg-white text-xs font-medium text-ink focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all cursor-pointer"
                  >
                    {specialPreps.map((prep) => (
                      <option key={prep.id} value={prep.id}>
                        {prep.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-1 text-[11px] text-muted leading-tight">
                  {specialPreps.find((p) => p.id === specialPrep)?.description}
                </div>
              </div>
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

          {/* Section 4: Clinical Context & Hospital Delivery Point */}
          <div className="space-y-5">
            <div>
              <h2 className="text-base font-bold text-ink tracking-tight">
                4. Clinical Context &amp; Hospital Delivery Point
              </h2>
              <p className="text-xs text-muted mt-0.5">
                Point of care destination within the hospital, prior transfusion reaction history, and clinical indication.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Delivery Address / Ward Location */}
              <div>
                <label
                  htmlFor="delivery-ward"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Hospital Delivery Point / Specific Ward{" "}
                  <span className="text-brand font-medium">*</span>
                </label>
                <div className="relative">
                  <MapPin
                    size={15}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
                  />
                  <input
                    id="delivery-ward"
                    value={deliveryWard}
                    onChange={(e) => setDeliveryWard(e.target.value)}
                    readOnly={isPending || leaving}
                    maxLength={150}
                    placeholder="e.g. Maternity Theatre 2, Trauma Bay 4, ICU Bed 12"
                    className="w-full h-11 pl-10 pr-4 rounded-xl border border-border-strong bg-white text-xs font-medium text-ink placeholder:text-muted focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all"
                  />
                </div>
                <span className="text-[10.5px] text-muted block mt-1">
                  Specifies where courier delivers the cold-chain box inside your facility.
                </span>
              </div>

              {/* Clinical Reference / ER Ticket */}
              <div>
                <label
                  htmlFor="clinical-ref"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Clinical Reference / ER Ticket{" "}
                  <span className="text-muted font-normal">(optional)</span>
                </label>
                <div className="relative">
                  <Building
                    size={15}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
                  />
                  <input
                    id="clinical-ref"
                    name="clinicalReference"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    readOnly={isPending || leaving}
                    maxLength={120}
                    aria-invalid={Boolean(state.fieldErrors?.clinicalReference?.length)}
                    placeholder="e.g. ER-88219 or OB-2026-09"
                    className="w-full h-11 pl-10 pr-4 rounded-xl border border-border-strong bg-white text-xs font-medium text-ink placeholder:text-muted focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all"
                  />
                </div>
                <FieldError message={state.fieldErrors?.clinicalReference?.[0]} />
              </div>
            </div>

            {/* Transfusion Reaction Safety Checkbox & Details */}
            <div className="p-4 rounded-2xl border border-border bg-surface-muted/60 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold text-ink block">
                    Past History of Transfusion Reaction or Irregular Antibodies
                  </span>
                  <span className="text-[11px] text-muted block mt-0.5">
                    Alerts blood bank dispatchers to enforce extended antibody screening and pre-transfusion cross-matching.
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={hasTransfusionReaction}
                    onChange={(e) => setHasTransfusionReaction(e.target.checked)}
                    disabled={isPending || leaving}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                </label>
              </div>

              {hasTransfusionReaction && (
                <div className="space-y-2 pt-2 border-t border-border">
                  <div className="flex items-center gap-2 text-xs font-semibold text-amber-800">
                    <AlertTriangle size={14} className="text-amber-600" />
                    <span>Patient Transfusion Reaction Protocol Active</span>
                  </div>
                  <input
                    type="text"
                    value={reactionDetails}
                    onChange={(e) => setReactionDetails(e.target.value)}
                    placeholder="Specify reaction type or antibodies: e.g. Febrile non-hemolytic (FNHTR), Anti-Kell, severe urticaria"
                    maxLength={200}
                    disabled={isPending || leaving}
                    className="w-full h-10 px-3.5 rounded-xl border border-amber-300 bg-white text-xs font-medium text-ink placeholder:text-muted focus:outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-600/20"
                  />
                  <div className="flex flex-wrap gap-1.5 text-[10.5px]">
                    <span className="text-muted">Common:</span>
                    {["Febrile non-hemolytic (FNHTR)", "Urticaria / Allergy", "Anti-Kell", "Anti-D alloantibody"].map(
                      (preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setReactionDetails(preset)}
                          className="px-2 py-0.5 rounded-md bg-white border border-border text-slate-600 hover:border-amber-400 hover:text-amber-800 transition-colors"
                        >
                          {preset}
                        </button>
                      ),
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Brief Clinical Context (renamed from Operational Notes) */}
            <div>
              <label
                htmlFor="notes"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Brief Clinical Context{" "}
                <span className="text-muted font-normal">(clinical justification &amp; indications)</span>
              </label>
              <textarea
                id="notes"
                name="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                readOnly={isPending || leaving}
                placeholder="e.g. Postpartum hemorrhage (PPH) post-emergency Caesarean section, estimated blood loss >1,500 mL, Hb 6.2 g/dL. Cross-match sample dispatched to blood bank."
                maxLength={1200}
                rows={3}
                aria-invalid={Boolean(state.fieldErrors?.notes?.length)}
                className="w-full p-3 rounded-xl border border-border-strong bg-white text-xs font-medium text-ink placeholder:text-muted focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all resize-none"
              />
              <div className="flex items-center justify-between mt-1 text-[10.5px] text-muted">
                <span>Communicated to regional blood bank dispatchers and clinical officers.</span>
                <span>{notes.length}/1,200 characters</span>
              </div>
              <FieldError message={state.fieldErrors?.notes?.[0]} />
            </div>
          </div>

          {/* Summary Alert Banner */}
          <div className="p-4 rounded-2xl bg-brand-soft/70 border border-brand/20 flex items-start gap-3 text-xs">
            <AlertCircle size={18} className="text-brand shrink-0 mt-0.5" />
            <div className="space-y-1">
              <strong className="font-bold text-brand-dark block text-xs">
                Request Validation &amp; Smart Dispatch Summary
              </strong>
              <p className="text-slate-700 text-[11.5px] leading-relaxed">
                Searching for{" "}
                <strong>
                  {units} unit{units === 1 ? "" : "s"}
                </strong>{" "}
                of <strong>{formatBloodGroup(group)}</strong> (
                {specialPrep !== "STANDARD"
                  ? specialPreps.find((p) => p.id === specialPrep)?.label
                  : formatComponent(component)}
                ) with <strong>{formatUrgency(urgency)}</strong> dispatch status.
                {deliveryWard.trim() && (
                  <> Destination: <strong>{deliveryWard.trim()}</strong>.</>
                )}
                {hasTransfusionReaction && (
                  <span className="text-amber-800 font-semibold block mt-0.5">
                    ⚠️ Transfusion reaction alert attached. Extended compatibility screening flagged.
                  </span>
                )}
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
