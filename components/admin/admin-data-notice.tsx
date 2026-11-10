/** Explicit boundary for admin mockups whose network APIs do not exist yet. */

import { FlaskConical } from "lucide-react";

export function AdminDataNotice() {
  return (
    <div
      className="mb-5 flex items-start gap-3 rounded-2xl border border-warning/30 bg-warning-soft/60 px-4 py-3 text-xs text-slate-700"
      role="note"
    >
      <FlaskConical size={17} className="mt-0.5 shrink-0 text-warning" />
      <div>
        <strong className="block text-ink">Admin interface preview</strong>
        <p className="mt-0.5 leading-relaxed">
          Network-wide administration is not enabled in this environment. This workspace contains
          preview data for interface review and must not be used for operational decisions.
        </p>
      </div>
    </div>
  );
}
