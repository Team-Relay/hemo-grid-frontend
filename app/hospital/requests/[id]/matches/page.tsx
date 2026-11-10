/** Loads real ranked provider candidates for a hospital request after validating its UUID. */

import { notFound, redirect } from "next/navigation";
import { CheckCircle2, MapPin, Network, ShieldCheck, XCircle } from "lucide-react";

import {
  BloodBadge,
  ButtonLink,
  EmptyState,
  PageHeader,
  Panel,
  TableShell,
} from "@/components/ui/core";
import { ProviderSelection } from "@/features/requests/provider-selection";
import { ApiClientError } from "@/lib/api/errors";
import { getHospitalRequestMatches } from "@/lib/data/hospital";
import { formatBloodGroup, formatComponent } from "@/lib/domain";
import { requestIdSchema } from "@/lib/validation/blood-request";
import type { Candidate } from "@/types/domain";

export default async function MatchesPage({
  params,
}: PageProps<"/hospital/requests/[id]/matches">) {
  const { id } = await params;
  if (!requestIdSchema.safeParse(id).success) notFound();

  let data;
  try {
    data = await getHospitalRequestMatches(id);
  } catch (error) {
    if (error instanceof ApiClientError && error.status === 404) notFound();
    throw error;
  }

  const { request, candidates } = data;
  if (request.status !== "REQUESTED" || request.providerId) {
    redirect(`/hospital/requests/${request.id}`);
  }

  const best = candidates.find((candidate) => candidate.canFullyFulfil);

  return (
    <div className="space-y-6">
      <PageHeader
        backHref="/hospital/requests"
        eyebrow={request.reference}
        title="Eligible blood banks"
        description={`Exact matches for ${request.units} units of ${formatBloodGroup(request.bloodGroup)} ${formatComponent(request.component).toLowerCase()}, ranked by available capacity and straight-line distance where coordinates are available.`}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[1.35fr_0.85fr] gap-5 items-stretch">
        <Panel className="min-h-[390px] overflow-hidden p-0 relative bg-[radial-gradient(circle_at_25%_25%,rgba(108,92,231,0.12),transparent_38%),linear-gradient(145deg,#f7f8f8,#eef1f0)]">
          <div className="absolute inset-0 opacity-50 [background-image:linear-gradient(rgba(90,102,98,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(90,102,98,0.08)_1px,transparent_1px)] [background-size:28px_28px]" />
          <div className="relative z-10 flex min-h-[390px] flex-col items-center justify-center px-8 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-white text-brand shadow-sm">
              <Network size={24} />
            </span>
            <strong className="mt-5 text-base text-ink">Candidate distance ranking</strong>
            <p className="mt-2 max-w-[420px] text-xs leading-6 text-muted">
              HemoGrid ranked {candidates.length} candidate{candidates.length === 1 ? "" : "s"}{" "}
              using current free inventory and verified distance data. Review the available
              facilities and confirm one that can fulfil the complete request.
            </p>
          </div>
        </Panel>

        {best ? (
          <Panel className="p-6 space-y-5 bg-white border border-brand/30 shadow-sm relative overflow-hidden">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-brand-soft text-brand-dark border border-brand/20">
              <ShieldCheck size={14} className="text-brand" /> Best Eligible Fulfilment Match
            </div>

            <div className="flex items-start gap-3.5">
              <BloodBadge group={best.bloodGroup} large />
              <div>
                <h2 className="text-xl font-bold tracking-tight text-ink">
                  {best.organizationName}
                </h2>
                <p className="text-xs text-muted flex items-center gap-1 mt-1">
                  <MapPin size={13} className="text-brand" />
                  {best.distanceKm === undefined
                    ? "Distance pending verification"
                    : `${best.distanceKm} km straight-line distance`}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 py-3 border-y border-border text-center">
              <div className="px-1">
                <strong className="block text-xl font-bold text-ink tabular-nums">
                  {best.unitsFree}
                </strong>
                <span className="text-[10px] text-muted uppercase font-medium">Free Units</span>
              </div>
              <div className="px-1 border-l border-border">
                <strong className="block text-xl font-bold text-ink tabular-nums">
                  {formatDistance(best)}
                </strong>
                <span className="text-[10px] text-muted uppercase font-medium">Distance</span>
              </div>
              <div className="px-1 border-l border-border">
                <strong className="block text-xl font-bold text-ink tabular-nums">
                  #{best.rank}
                </strong>
                <span className="text-[10px] text-muted uppercase font-medium">Network Rank</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-success-soft/70 border border-success/30 flex items-center gap-3 text-xs">
              <CheckCircle2 size={18} className="text-success shrink-0" />
              <div>
                <strong className="font-bold text-emerald-800 block text-xs">
                  Full Request Capacity Verified
                </strong>
                <span className="text-emerald-700 text-[11px] block mt-0.5">
                  Current availability can fulfil all {request.units} requested units.
                </span>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <ProviderSelection
                requestId={request.id}
                providerId={best.organizationId}
                units={request.units}
                variant="primary"
              />
              <p className="text-[10.5px] text-muted text-center">
                Availability is verified again when you confirm this provider.
              </p>
            </div>
          </Panel>
        ) : (
          <Panel>
            <EmptyState
              title="No bank can fully fulfil this request"
              description="Partial matches are listed for visibility, but HemoGrid will not split one request across multiple banks."
              action={
                <ButtonLink href={`/hospital/requests/${request.id}`}>View request</ButtonLink>
              }
            />
          </Panel>
        )}
      </div>

      <Panel className="p-6 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <div>
            <h2 className="text-base font-bold text-ink">Other Network Facilities</h2>
            <p className="text-xs text-muted mt-0.5">
              Ranked exact-group and exact-component inventory candidates
            </p>
          </div>
          <span className="text-xs font-semibold text-muted">
            {candidates.length} candidates evaluated
          </span>
        </div>

        {candidates.length > 0 ? (
          <TableShell>
            <thead>
              <tr className="border-b border-border text-[11.5px] font-semibold text-muted uppercase tracking-wider text-left">
                <th className="py-3 px-4">Rank</th>
                <th className="py-3 px-4">Facility Name</th>
                <th className="py-3 px-4">Free Stock</th>
                <th className="py-3 px-4">Distance</th>
                <th className="py-3 px-4">Match Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-xs">
              {candidates.map((candidate) => (
                <tr
                  key={candidate.organizationId}
                  className="hover:bg-surface-muted/50 transition-colors"
                >
                  <td className="py-3.5 px-4 font-bold text-muted tabular-nums">
                    #{candidate.rank}
                  </td>
                  <td className="py-3.5 px-4">
                    <strong className="block font-bold text-ink text-[13px]">
                      {candidate.organizationName}
                    </strong>
                  </td>
                  <td className="py-3.5 px-4 font-bold text-ink tabular-nums">
                    {candidate.unitsFree}{" "}
                    <span className="text-muted font-normal text-[11px]">units</span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-700 font-medium">
                    {formatDistance(candidate)}
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
                      <ProviderSelection
                        requestId={request.id}
                        providerId={candidate.organizationId}
                        units={request.units}
                      />
                    ) : (
                      <span className="text-muted text-[11px] italic">Not eligible</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </TableShell>
        ) : (
          <EmptyState
            title="No matching inventory candidates"
            description="No active blood bank currently has free inventory for this exact blood group and component."
            action={<ButtonLink href={`/hospital/requests/${request.id}`}>View request</ButtonLink>}
          />
        )}
      </Panel>
    </div>
  );
}

function formatDistance(candidate: Candidate): string {
  return candidate.distanceKm === undefined ? "—" : `${candidate.distanceKm} km`;
}
