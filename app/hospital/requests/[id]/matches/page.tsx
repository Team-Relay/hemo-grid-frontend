/** Loads real ranked provider candidates for a hospital request after validating its UUID. */

import { notFound, redirect } from "next/navigation";
import {
  CheckCircle2,
  Clock3,
  MapPin,
  Network,
  ShieldCheck,
  Sparkles,
  ThermometerSnowflake,
  XCircle,
} from "lucide-react";

import {
  BloodBadge,
  ButtonLink,
  ColdChainBadge,
  EmptyState,
  MatchTypeBadge,
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
        description={`Smart Dispatch ranking for ${request.units} units of ${formatBloodGroup(request.bloodGroup)} ${formatComponent(request.component).toLowerCase()} across ABO/Rh compatibility, Universal O− conservation, cold-chain integrity, and road-corridor transit ETA.`}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[1.35fr_0.85fr] gap-5 items-stretch">
        <Panel className="min-h-[390px] p-6 sm:p-7 relative bg-white border border-border shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-muted border border-border text-[11px] font-semibold text-ink">
              <Network size={14} className="text-brand" />
              Smart Dispatch Engine · {candidates.length} candidate
              {candidates.length === 1 ? "" : "s"} evaluated
            </div>
            <div>
              <h2 className="text-lg font-bold text-ink tracking-tight">
                Clinical Triage &amp; Corridor Evaluation
              </h2>
              <p className="mt-1 max-w-[540px] text-xs leading-relaxed text-muted">
                Every candidate facility is verified across live clinical compatibility, excursion safety, and verified corridor drive times before recommendation.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-6">
            <div className="p-4 rounded-xl bg-surface-muted/60 border border-border/80 space-y-1.5">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-brand">
                <Sparkles size={13} className="text-brand" /> 1. O− Conservation Gate
              </span>
              <p className="text-[11px] text-muted leading-relaxed">
                Prioritizes exact ABO/Rh stock first so Universal O− reserves are preserved for
                unidentified trauma and O− recipients.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-surface-muted/60 border border-border/80 space-y-1.5">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700">
                <ThermometerSnowflake size={13} className="text-emerald-600" /> 2. Cold-Chain Gate
              </span>
              <p className="text-[11px] text-muted leading-relaxed">
                Automatically excludes blood units exposed to &gt;6.0°C fridge temperature
                excursions during facility power outages.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-surface-muted/60 border border-border/80 space-y-1.5">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-ink">
                <Clock3 size={13} className="text-brand" /> 3. Road-Corridor ETA
              </span>
              <p className="text-[11px] text-muted leading-relaxed">
                Ranks eligible RBTCs and satellites by verified road transit hours
                (2.51h median ETA across 2,162 corridors).
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-border/80 text-[11px] text-muted">
            <span>Single-provider atomic reservation — no split-bank partial allocations</span>
            <span className="font-semibold text-ink">
              Target: {request.units} units · {formatBloodGroup(request.bloodGroup)}{" "}
              {formatComponent(request.component)}
            </span>
          </div>
        </Panel>

        {best ? (
          <Panel className="p-6 space-y-5 bg-white border border-border shadow-xs relative overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <ShieldCheck size={14} className="text-emerald-600" /> Optimal Clinical Match
              </div>
              {best.facilityCode && (
                <span className="px-2.5 py-0.5 rounded-md bg-surface-muted border border-border text-[11px] font-semibold text-slate-700">
                  {best.facilityCode}
                </span>
              )}
            </div>

            <div className="flex items-start gap-3.5">
              <BloodBadge group={best.bloodGroup} large />
              <div className="space-y-1.5">
                <h2 className="text-xl font-bold tracking-tight text-ink">
                  {best.organizationName}
                </h2>
                <p className="text-xs text-muted flex items-center gap-1">
                  <MapPin size={13} className="text-brand" />
                  {best.distanceKm === undefined
                    ? "Distance pending verification"
                    : `${best.distanceKm} km road corridor`}
                  {best.estimatedTransitHours !== undefined &&
                    ` · ~${best.estimatedTransitHours}h transit ETA`}
                </p>
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  <MatchTypeBadge
                    matchType={best.matchType}
                    offeredGroup={best.offeredBloodGroup}
                  />
                  <ColdChainBadge
                    verified={best.coldChainVerified}
                    tempCelsius={best.fridgeTempCelsius}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 py-3 border-y border-border text-center">
              <div className="px-1">
                <strong className="block text-xl font-bold text-ink tabular-nums">
                  {best.unitsFree}
                </strong>
                <span className="text-[10px] text-muted uppercase font-medium">Free Units</span>
              </div>
              <div className="px-1 border-l border-border">
                <strong className="block text-xl font-bold text-ink tabular-nums">
                  {formatTransitEta(best)}
                </strong>
                <span className="text-[10px] text-muted uppercase font-medium">Road ETA</span>
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
                <span className="text-[10px] text-muted uppercase font-medium">Rank</span>
              </div>
            </div>

            {best.recommendationReasons && best.recommendationReasons.length > 0 ? (
              <div className="p-3.5 rounded-xl bg-surface-muted/60 border border-border/80 space-y-1.5 text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                  <strong className="font-semibold text-ink text-xs">
                    Clinical &amp; Logistics Assessment
                  </strong>
                </div>
                <ul className="space-y-1 pl-5 list-disc text-[11px] text-muted leading-relaxed">
                  {best.recommendationReasons.map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>
              </div>
            ) : (
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
            )}

            <div className="space-y-2 pt-1">
              <ProviderSelection
                requestId={request.id}
                providerId={best.organizationId}
                units={request.units}
                variant="primary"
              />
              <p className="text-[10.5px] text-muted text-center">
                Availability and cold-chain status are verified atomically on confirmation.
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
            <h2 className="text-base font-bold text-ink">All Evaluated Network Facilities</h2>
            <p className="text-xs text-muted mt-0.5">
              Ranked by full-capacity eligibility, O− conservation rule, cold-chain verification,
              and road transit ETA
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
                <th className="py-3 px-4">Compatibility</th>
                <th className="py-3 px-4">Free Stock</th>
                <th className="py-3 px-4">Road ETA &amp; Distance</th>
                <th className="py-3 px-4">Cold-Chain Gate</th>
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
                    {candidate.facilityCode && (
                      <span className="text-[11px] text-muted">
                        {candidate.facilityCode}
                        {candidate.facilityTier
                          ? ` · ${candidate.facilityTier.replaceAll("_", " ")}`
                          : ""}
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <MatchTypeBadge
                      matchType={candidate.matchType}
                      offeredGroup={candidate.offeredBloodGroup}
                    />
                  </td>
                  <td className="py-3.5 px-4 font-bold text-ink tabular-nums">
                    {candidate.unitsFree}{" "}
                    <span className="text-muted font-normal text-[11px]">units</span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-700 font-medium tabular-nums">
                    <strong className="text-ink font-semibold">
                      {formatTransitEta(candidate)}
                    </strong>
                    <span className="block text-[11px] text-muted">
                      {formatDistance(candidate)}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <ColdChainBadge
                      verified={candidate.coldChainVerified}
                      tempCelsius={candidate.fridgeTempCelsius}
                      quarantinedUnits={candidate.quarantinedUnitsExcluded}
                    />
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

function formatTransitEta(candidate: Candidate): string {
  return candidate.estimatedTransitHours === undefined ? "—" : `${candidate.estimatedTransitHours}h`;
}
