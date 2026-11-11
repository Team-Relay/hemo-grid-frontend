/**
 * Coordinator mission control. All operational counters use the authenticated
 * backend's current critical red-cell queue; evaluation findings are explicitly
 * labeled as outcomes on synthetic test cases, never as live clinical telemetry.
 */
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  GitBranch,
  HeartPulse,
  Layers3,
  Route,
  ShieldCheck,
  ThermometerSnowflake,
  Truck,
} from "lucide-react";

import { BloodBadge } from "@/components/ui/core";
import { getAdminDispatchPlannerRequests } from "@/lib/data/admin";

const steps = [
  {
    step: "01",
    icon: HeartPulse,
    role: "Hospital officer",
    title: "Raise the need",
    description: "Record the blood group, urgency and quantity. Review eligible supplier evidence.",
  },
  {
    step: "02",
    icon: GitBranch,
    role: "Network coordinator",
    title: "Resolve competing needs",
    description: "Compare joint allocations against nearest-eligible options while respecting shared stock.",
  },
  {
    step: "03",
    icon: ShieldCheck,
    role: "Responsible staff",
    title: "Review the evidence",
    description: "Check group rules, quarantined stock and recorded cold-chain conditions before action.",
  },
  {
    step: "04",
    icon: Truck,
    role: "Supplying blood bank",
    title: "Confirm and fulfil",
    description: "Accept and reserve stock, then record preparation, transit and delivery.",
  },
] as const;

function timeInNairobi(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Time unavailable";
  return new Intl.DateTimeFormat("en-KE", {
    timeZone: "Africa/Nairobi",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default async function AdminDashboard() {
  const requests = await getAdminDispatchPlannerRequests();
  const activeHospitals = new Set(requests.map((r) => r.requester.id)).size;
  const unitsRequested = requests.reduce((sum, r) => sum + r.unitsRequired, 0);
  const urgentCases = requests.slice(0, 4);

  return (
    <div className="space-y-6 pb-4">
      <section className="relative isolate overflow-hidden rounded-[28px] border border-[#1e394c] bg-[#102534] text-white shadow-[0_16px_44px_rgba(15,35,48,0.16)]">
        <div
          className="pointer-events-none absolute right-[-100px] top-[-130px] h-[380px] w-[380px] rounded-full border border-cyan-200/15"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute right-[-35px] top-[-60px] h-[280px] w-[280px] rounded-full border border-cyan-200/15"
          aria-hidden="true"
        />
        <div className="grid gap-8 p-6 sm:p-9 xl:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)] xl:items-center xl:gap-10">
          <div className="relative z-10 min-w-0">
            <p className="m-0 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#8de9df]">
              <span className="h-2 w-2 rounded-full bg-[#60e4d1]" aria-hidden="true" />
              HemoGrid / Emergency dispatch
            </p>
            <h1 className="mt-5 max-w-[670px] text-[clamp(27px,3vw,43px)] font-semibold leading-[1.14] tracking-[-0.045em]">
              The closest blood bank is not always the right one.
            </h1>
            <p className="mt-4 max-w-[610px] text-[13px] leading-6 text-[#b6ccd4] sm:text-[14px]">
              A hospital needs compatible, dispatchable units, not just a nearby pin.
              HemoGrid brings stock, quarantine checks and shared-supply planning into one
              explainable, staff-controlled decision.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                href="/admin/dispatch-planner"
                className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#88efe0] px-5 py-2.5 text-[12px] font-bold text-[#12352f] transition hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Open joint dispatch planner <ArrowUpRight size={16} />
              </Link>
              <Link
                href="/admin/requests"
                className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#537080] px-4 py-2.5 text-[12px] font-semibold text-white transition hover:border-[#a7ccd7] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Explore request history <ArrowRight size={15} />
              </Link>
            </div>
            <p className="mt-5 text-[10.5px] leading-5 text-[#93aeb9]">
              Synthetic Kenyan demonstration network · Planning is advisory · Human approval required
            </p>
          </div>

          <div className="relative z-10 rounded-[22px] border border-white/15 bg-white/[0.07] p-4 shadow-inner sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[11px] font-semibold text-[#cce1e7]">The dispatch decision</span>
              <span className="rounded-full border border-[#77e8d3]/30 bg-[#77e8d3]/10 px-2.5 py-1 text-[10px] font-medium text-[#a1f4e4]">
                Evidence before action
              </span>
            </div>
            <div className="mt-4 space-y-3">
              <div className="rounded-xl border border-[#c8a09b]/20 bg-[#501f28]/40 p-3.5">
                <div className="flex items-center gap-2 text-[11px] font-semibold text-[#ffcfcb]">
                  <Route size={15} /> Distance-only choice
                </div>
                <p className="m-0 mt-1 text-[12px] leading-5 text-[#f2d6d5]">
                  Nearby does not establish available stock, compatibility or cold-chain clearance.
                </p>
              </div>
              <div className="flex justify-center" aria-hidden="true">
                <ArrowRight className="rotate-90 text-[#8de9df]" size={19} />
              </div>
              <div className="rounded-xl border border-[#8de9df]/35 bg-[#8de9df]/10 p-3.5">
                <div className="flex items-center gap-2 text-[11px] font-semibold text-[#a7fff0]">
                  <CheckCircle2 size={15} /> HemoGrid proposal
                </div>
                <p className="m-0 mt-1 text-[12px] leading-5 text-[#dfefed]">
                  Match eligible stock, show excluded inventory, and account for simultaneous hospital needs.
                </p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 divide-x divide-white/15 border-t border-white/15 pt-4 text-center">
              <div className="px-2">
                <strong className="block text-[22px] font-semibold tabular-nums">{requests.length}</strong>
                <span className="mt-1 block text-[10px] leading-4 text-[#a9c2ca]">Pending critical requests</span>
              </div>
              <div className="px-2">
                <strong className="block text-[22px] font-semibold tabular-nums">{unitsRequested}</strong>
                <span className="mt-1 block text-[10px] leading-4 text-[#a9c2ca]">Units requested</span>
              </div>
              <div className="px-2">
                <strong className="block text-[22px] font-semibold tabular-nums">{activeHospitals}</strong>
                <span className="mt-1 block text-[10px] leading-4 text-[#a9c2ca]">Requesting hospitals</span>
              </div>
            </div>
            <p className="mb-0 mt-3 text-center text-[10px] text-[#94abb5]">
              Counts reflect the current authenticated demo queue.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(310px,0.75fr)]">
        <div className="min-w-0 rounded-[22px] border border-border bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="m-0 text-[10px] font-bold uppercase tracking-[0.15em] text-brand">
                Current decision queue
              </p>
              <h2 className="mt-1.5 text-lg font-semibold tracking-tight text-ink">Critical red-cell requests</h2>
              <p className="mt-1 text-[12px] leading-5 text-muted">
                Pending requests from the backend. None is automatically allocated.
              </p>
            </div>
            <Link href="/admin/dispatch-planner" className="inline-flex min-h-9 items-center gap-1.5 text-[12px] font-semibold text-brand hover:underline">
              Plan a batch <ArrowRight size={14} />
            </Link>
          </div>
          {urgentCases.length === 0 ? (
            <div className="mt-5 rounded-xl border border-dashed border-border p-6 text-center">
              <ClipboardCheck size={22} className="mx-auto text-success" />
              <p className="mb-0 mt-2 text-[12px] font-semibold text-ink">No pending critical requests</p>
              <p className="mb-0 mt-1 text-[11px] text-muted">The queue refreshes when the page reloads.</p>
            </div>
          ) : (
            <div className="mt-4 divide-y divide-border">
              {urgentCases.map((request, index) => (
                <div key={request.id} className="flex flex-wrap items-center gap-3 py-3.5 first:pt-0 last:pb-0">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-[#f4d4cd] bg-[#fff1ed] text-[12px] font-bold tabular-nums text-[#a63d2b]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-[145px] flex-1">
                    <strong className="block truncate text-[12px] font-semibold text-ink">{request.requester.name}</strong>
                    <span className="mt-0.5 flex items-center gap-1 text-[10.5px] text-muted">
                      <Clock3 size={12} /> {timeInNairobi(request.requestedAt)} EAT
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BloodBadge group={request.bloodGroup} />
                    <span className="text-[12px] font-semibold tabular-nums text-ink">{request.unitsRequired} units</span>
                  </div>
                  <span className="rounded-full border border-[#f2d3cb] bg-[#fff2ee] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#a54536]">
                    Critical
                  </span>
                </div>
              ))}
            </div>
          )}
          <div className="mt-5 flex flex-wrap items-center gap-2 rounded-xl bg-surface-muted px-3.5 py-3 text-[11px] leading-5 text-muted">
            <Layers3 size={16} className="shrink-0 text-brand" />
            Joint planning evaluates 2–5 approved critical requests against the same dispatchable stock.
          </div>
        </div>

        <div className="min-w-0 rounded-[22px] border border-border bg-white p-5 shadow-sm sm:p-6">
          <p className="m-0 text-[10px] font-bold uppercase tracking-[0.15em] text-brand">
            Why eligibility changes decisions
          </p>
          <h2 className="mt-1.5 text-lg font-semibold tracking-tight text-ink">A measured failure mode</h2>
          <p className="mt-1 text-[12px] leading-5 text-muted">
            Reproducible evaluation on 1,072 synthetic emergency red-cell request shapes.
          </p>
          <div className="mt-5 rounded-2xl border border-[#ecd5ce] bg-[#fff7f4] p-4">
            <span className="block text-[10px] font-semibold uppercase tracking-wide text-[#ad4937]">Distance-only selection</span>
            <strong className="mt-2 block text-[33px] font-semibold tracking-tight tabular-nums text-[#9b392d]">
              749 <span className="text-[16px] font-medium text-[#a45f52]">/ 1,072</span>
            </strong>
            <p className="mb-0 mt-1 text-[11px] leading-5 text-[#875349]">
              Proposed suppliers that failed at least one configured eligibility check.
            </p>
          </div>
          <div className="mt-3 rounded-2xl border border-[#c4e9df] bg-[#effcf7] p-4">
            <span className="block text-[10px] font-semibold uppercase tracking-wide text-[#147c6b]">Inventory-aware proposals</span>
            <strong className="mt-2 block text-[33px] font-semibold tracking-tight tabular-nums text-[#126d5f]">
              1,044 <span className="text-[16px] font-medium text-[#488b7e]">/ 1,072</span>
            </strong>
            <p className="mb-0 mt-1 text-[11px] leading-5 text-[#42776d]">
              Full-quantity eligible proposals under the same synthetic snapshot.
            </p>
          </div>
          <p className="mb-0 mt-4 text-[11px] leading-5 text-muted">
            These are simulated eligibility outcomes, not validated transfusion decisions or measured delivery times.
          </p>
          <Link href="https://github.com/Team-Relay/hemo-grid-backend#ai-and-data" target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-brand hover:underline">
            Review evaluation assumptions <ArrowUpRight size={13} />
          </Link>
        </div>
      </section>

      <section className="rounded-[22px] border border-border bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="m-0 text-[10px] font-bold uppercase tracking-[0.15em] text-brand">
              From request to delivery
            </p>
            <h2 className="mt-1.5 text-lg font-semibold tracking-tight text-ink">
              One accountable workflow. Four clear decisions.
            </h2>
          </div>
          <Link href="/admin/dispatch-planner" className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-brand hover:underline">
            Inspect the planning step <ArrowRight size={14} />
          </Link>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {steps.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.step} className="relative min-w-0 rounded-2xl border border-border bg-[#f7faf9] p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-white text-brand shadow-sm"><Icon size={19} /></span>
                  <span className="font-mono text-[11px] text-muted">{item.step}</span>
                </div>
                <p className="mb-0 mt-4 text-[10px] font-semibold uppercase tracking-wide text-brand">{item.role}</p>
                <h3 className="mt-1 text-[13px] font-semibold text-ink">{item.title}</h3>
                <p className="mb-0 mt-2 text-[11.5px] leading-5 text-muted">{item.description}</p>
              </div>
            );
          })}
        </div>
        <p className="mb-0 mt-4 flex flex-wrap items-center gap-2 text-[10.5px] leading-5 text-muted">
          <ThermometerSnowflake size={14} className="text-brand" />
          The demonstration uses seeded stock, recorded temperature checks and estimated routes.
          Qualified staff remain responsible for clinical suitability and release.
        </p>
      </section>
    </div>
  );
}
