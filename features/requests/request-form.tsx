"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Minus, Plus, Search } from "lucide-react";
import {
  bloodComponents,
  bloodGroups,
  formatBloodGroup,
  formatComponent,
  formatUrgency,
} from "@/lib/domain";
import type { BloodComponent, BloodGroup, RequestUrgency } from "@/types/domain";
import { Button, cn, PageHeader, Panel } from "@/components/ui/core";

const urgencies: RequestUrgency[] = ["ROUTINE", "URGENT", "CRITICAL"];
export function RequestForm() {
  const router = useRouter();
  const [group, setGroup] = useState<BloodGroup>("O_NEGATIVE");
  const [component, setComponent] = useState<BloodComponent>("RED_CELLS");
  const [units, setUnits] = useState(3);
  const [urgency, setUrgency] = useState<RequestUrgency>("CRITICAL");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [leaving, setLeaving] = useState(false);
  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (units < 1) return;
    setSubmitting(true);
    window.setTimeout(() => router.push("/hospital/requests/req-0142/matches"), 700);
  }
  return (
    <div className="form-page">
      <PageHeader
        backHref="/hospital/requests"
        eyebrow="Emergency fulfilment"
        title="Create blood request"
        description="Enter the exact blood group and component required. HemoGrid will search verified network inventory."
      />
      <form onSubmit={submit}>
        <Panel className="form-panel">
          <div className="form-section">
            <div className="form-section-head">
              <div>
                <h2>Blood group</h2>
                <p>
                  Select the exact group requested. Compatibility substitutions are not suggested.
                </p>
              </div>
              <div className="choice-grid">
                {bloodGroups.map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setGroup(value)}
                    className={cn("choice-card", value === group && "active")}
                  >
                    <strong>{formatBloodGroup(value)}</strong>
                    <small>{value.includes("POSITIVE") ? "Positive" : "Negative"}</small>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="form-section">
            <div className="form-section-head">
              <div>
                <h2>Blood component</h2>
                <p>Inventory matching uses the exact selected component.</p>
              </div>
              <div className="choice-grid">
                {bloodComponents.map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setComponent(value)}
                    className={cn("choice-card", value === component && "active")}
                  >
                    <strong>{formatComponent(value)}</strong>
                    <small>Screened inventory</small>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="form-section">
            <div className="form-section-head">
              <div>
                <h2>Quantity & urgency</h2>
                <p>Set the units required and the operational priority.</p>
              </div>
              <div className="field-grid">
                <div className="field">
                  <span className="field-label">Units required</span>
                  <div className="stepper">
                    <button
                      type="button"
                      onClick={() => setUnits(Math.max(1, units - 1))}
                      aria-label="Decrease units"
                    >
                      <Minus size={16} />
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={units}
                      onChange={(e) => setUnits(Math.max(1, Number(e.target.value)))}
                      aria-label="Units required"
                    />
                    <button
                      type="button"
                      onClick={() => setUnits(units + 1)}
                      aria-label="Increase units"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  <span className="field-hint">Minimum 1 unit</span>
                </div>
                <div className="field">
                  <span className="field-label">Urgency</span>
                  <div className="urgency-choices">
                    {urgencies.map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setUrgency(value)}
                        className={cn(
                          "urgency-choice",
                          `urgency-option-${value.toLowerCase()}`,
                          value === urgency && "active",
                        )}
                      >
                        {formatUrgency(value)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="form-section">
            <div className="form-section-head">
              <div>
                <h2>Request context</h2>
                <p>
                  Add references that help your team identify this request. Clinical details are
                  optional.
                </p>
              </div>
              <div className="field-grid">
                <div className="field">
                  <label htmlFor="clinical-ref">
                    Clinical reference <span>(optional)</span>
                  </label>
                  <input
                    id="clinical-ref"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    placeholder="e.g. ER-88219"
                  />
                </div>
                <div className="field field-full">
                  <label htmlFor="notes">
                    Operational notes <span>(optional)</span>
                  </label>
                  <textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Collection constraints or coordinator notes"
                    maxLength={300}
                  />
                  <span className="field-hint">{notes.length}/300 characters</span>
                </div>
              </div>
            </div>
          </div>
          <div className="form-section">
            <div className="inline-alert">
              <AlertCircle size={18} />
              <div>
                <strong>Request summary</strong>
                <p>
                  {units} unit{units === 1 ? "" : "s"} of {formatBloodGroup(group)}{" "}
                  {formatComponent(component).toLowerCase()} · {formatUrgency(urgency)}. The network
                  search checks exact inventory availability and distance.
                </p>
              </div>
            </div>
          </div>
          <div className="form-footer">
            <Button
              type="button"
              variant="secondary"
              isLoading={leaving}
              loadingText="Going back…"
              disabled={submitting}
              onClick={() => {
                setLeaving(true);
                router.back();
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={submitting}
              loadingText="Searching network…"
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
