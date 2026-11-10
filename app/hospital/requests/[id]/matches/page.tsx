import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock3, MapPin, ShieldCheck, XCircle } from "lucide-react";
import { NetworkMap } from "@/components/network/network-map";
import { BloodBadge, ButtonLink, PageHeader, Panel, TableShell } from "@/components/ui/core";
import { formatBloodGroup, formatComponent } from "@/lib/domain";
import { candidates, getRequest } from "@/lib/mock/data";

export default async function MatchesPage({
  params,
}: PageProps<"/hospital/requests/[id]/matches">) {
  const { id } = await params;
  const request = getRequest(id);
  const best = candidates[0];

  return (
    <div className="space-y-6">
      <PageHeader
        backHref="/hospital/requests"
        eyebrow={request.reference}
        title="Eligible blood banks"
        description={`Exact network matches for ${request.units} units of ${formatBloodGroup(request.bloodGroup)} ${formatComponent(request.component).toLowerCase()}, ranked by live fulfilment capacity and transit distance.`}
      />

      {/* Top Hero: Map + Best Match Card */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.35fr_0.85fr] gap-5 items-start">
        <NetworkMap compact selectedId={best.organizationId} />

        {/* Best Match Spotlight Card */}
        <Panel className="p-6 space-y-5 bg-white border border-brand/30 shadow-sm relative overflow-hidden">
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-brand-soft text-brand-dark border border-brand/20">
            <ShieldCheck size={14} className="text-brand" /> Best Eligible Fulfilment Match
          </div>

          {/* Title Header */}
          <div className="flex items-start gap-3.5">
            <BloodBadge group={best.bloodGroup} large />
            <div>
              <h2 className="text-xl font-bold tracking-tight text-ink">
                {best.organizationName}
              </h2>
              <p className="text-xs text-muted flex items-center gap-1 mt-1">
                <MapPin size={13} className="text-brand" /> {best.location}
              </p>
            </div>
          </div>

          {/* Metric Triplet */}
          <div className="grid grid-cols-3 gap-2 py-3 border-y border-border text-center">
            <div className="px-1">
              <strong className="block text-xl font-bold text-ink tabular-nums">{best.unitsFree}</strong>
              <span className="text-[10px] text-muted uppercase font-medium">Free Units</span>
            </div>
            <div className="px-1 border-l border-border">
              <strong className="block text-xl font-bold text-ink tabular-nums">{best.distanceKm} km</strong>
              <span className="text-[10px] text-muted uppercase font-medium">Transit Dist.</span>
            </div>
            <div className="px-1 border-l border-border">
              <strong className="block text-xl font-bold text-ink tabular-nums">~{best.fulfilmentMinutes}m</strong>
              <span className="text-[10px] text-muted uppercase font-medium">Est. Arrival</span>
            </div>
          </div>

          {/* Confirmation Notice */}
          <div className="p-3.5 rounded-2xl bg-success-soft/70 border border-success/30 flex items-center gap-3 text-xs">
            <CheckCircle2 size={18} className="text-success shrink-0" />
            <div>
              <strong className="font-bold text-emerald-800 block text-xs">Full Request Capacity Verified</strong>
              <span className="text-emerald-700 text-[11px] block mt-0.5">
                All {request.units} units can be locked and prepped immediately.
              </span>
            </div>
          </div>

          {/* Primary Action Button */}
          <div className="space-y-2 pt-1">
            <ButtonLink
              href={`/hospital/requests/${request.id}`}
              className="w-full h-11 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 shadow-sm"
            >
              Request {request.units} units from this facility <ArrowRight size={15} />
            </ButtonLink>
            <p className="text-[10.5px] text-muted text-center">
              Selecting triggers dispatch protocol to Maitama Blood Centre coordinators.
            </p>
          </div>
        </Panel>
      </div>

      {/* Alternative Facilities Table */}
      <Panel className="p-6 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <div>
            <h2 className="text-base font-bold text-ink">Other Network Facilities</h2>
            <p className="text-xs text-muted mt-0.5">
              Ranked alternative options matching exact blood group and component
            </p>
          </div>
          <span className="text-xs font-semibold text-muted">{candidates.length} candidates evaluated</span>
        </div>

        <TableShell>
          <thead>
            <tr className="border-b border-border text-[11.5px] font-semibold text-muted uppercase tracking-wider text-left">
              <th className="py-3 px-4">Rank</th>
              <th className="py-3 px-4">Facility Name</th>
              <th className="py-3 px-4">Free Stock</th>
              <th className="py-3 px-4">Distance</th>
              <th className="py-3 px-4">Est. Fulfilment</th>
              <th className="py-3 px-4">Match Status</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-xs">
            {candidates.map((candidate) => (
              <tr key={candidate.organizationId} className="hover:bg-surface-muted/50 transition-colors">
                <td className="py-3.5 px-4 font-bold text-muted tabular-nums">
                  #{candidate.rank}
                </td>
                <td className="py-3.5 px-4">
                  <strong className="block font-bold text-ink text-[13px]">{candidate.organizationName}</strong>
                  <span className="text-[11px] text-muted block mt-0.5">{candidate.location}</span>
                </td>
                <td className="py-3.5 px-4 font-bold text-ink tabular-nums">
                  {candidate.unitsFree} <span className="text-muted font-normal text-[11px]">units</span>
                </td>
                <td className="py-3.5 px-4 text-slate-700 font-medium">
                  {candidate.distanceKm} km
                </td>
                <td className="py-3.5 px-4 text-slate-700 font-medium">
                  <span className="inline-flex items-center gap-1">
                    <Clock3 size={13} className="text-muted" /> ~{candidate.fulfilmentMinutes} min
                  </span>
                </td>
                <td className="py-3.5 px-4">
                  {candidate.canFullyFulfil ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-success-soft text-success border border-success/20">
                      <CheckCircle2 size={13} /> Full Match
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-critical-soft text-critical border border-critical/20">
                      <XCircle size={13} /> Insufficient Stock
                    </span>
                  )}
                </td>
                <td className="py-3.5 px-4 text-right">
                  {candidate.canFullyFulfil ? (
                    <Link
                      href={`/hospital/requests/${request.id}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:text-brand-dark transition-colors"
                    >
                      Select <ArrowRight size={13} />
                    </Link>
                  ) : (
                    <span className="text-muted text-[11px] italic">Unavailable</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      </Panel>
    </div>
  );
}
