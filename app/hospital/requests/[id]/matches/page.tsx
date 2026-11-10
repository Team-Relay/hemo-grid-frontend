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
    <>
      <PageHeader
        backHref="/hospital/requests"
        eyebrow={request.reference}
        title="Eligible blood banks"
        description={`Exact matches for ${request.units} units of ${formatBloodGroup(request.bloodGroup)} ${formatComponent(request.component).toLowerCase()}, ranked by fulfilment and distance.`}
      />
      <div className="matches-hero">
        <NetworkMap compact selectedId={best.organizationId} />
        <Panel className="best-match">
          <div className="best-match-label">
            <ShieldCheck size={14} /> Best eligible match
          </div>
          <div className="best-match-title">
            <BloodBadge group={best.bloodGroup} large />
            <div>
              <h2>{best.organizationName}</h2>
              <p>
                <MapPin size={13} /> {best.location}
              </p>
            </div>
          </div>
          <div className="match-metrics">
            <div>
              <strong>{best.unitsFree}</strong>
              <span>free units</span>
            </div>
            <div>
              <strong>{best.distanceKm} km</strong>
              <span>distance</span>
            </div>
            <div>
              <strong>~{best.fulfilmentMinutes} min</strong>
              <span>fulfilment</span>
            </div>
          </div>
          <div className="eligible-note">
            <CheckCircle2 size={16} />
            <span>
              <strong>Can fully fulfil this request</strong>
              <small>{request.units} units can be reserved immediately</small>
            </span>
          </div>
          <ButtonLink href={`/hospital/requests/${request.id}`} className="full-button">
            Request {request.units} units <ArrowRight size={15} />
          </ButtonLink>
          <p className="best-match-foot">
            Selection sends this request to the facility for acceptance.
          </p>
        </Panel>
      </div>
      <Panel className="other-matches" padding={false}>
        <div className="other-matches-head">
          <div>
            <h2>Other facilities</h2>
            <p>Exact blood group and component only</p>
          </div>
          <span>{candidates.length} results</span>
        </div>
        <TableShell>
          <thead>
            <tr>
              <th>Rank</th>
              <th>Blood bank</th>
              <th>Free units</th>
              <th>Distance</th>
              <th>Est. fulfilment</th>
              <th>Eligibility</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {candidates.map((candidate) => (
              <tr key={candidate.organizationId}>
                <td>
                  <span className="rank-number">{candidate.rank}</span>
                </td>
                <td>
                  <span className="table-primary">{candidate.organizationName}</span>
                  <span className="table-secondary">{candidate.location}</span>
                </td>
                <td>
                  <strong>{candidate.unitsFree}</strong> units
                </td>
                <td>{candidate.distanceKm} km</td>
                <td>
                  <Clock3 size={13} className="table-icon" /> ~{candidate.fulfilmentMinutes} min
                </td>
                <td>
                  {candidate.canFullyFulfil ? (
                    <span className="eligibility yes">
                      <CheckCircle2 size={13} /> Full match
                    </span>
                  ) : (
                    <span className="eligibility no">
                      <XCircle size={13} /> Insufficient stock
                    </span>
                  )}
                </td>
                <td>
                  {candidate.canFullyFulfil ? (
                    <Link href={`/hospital/requests/${request.id}`} className="text-link">
                      Select <ArrowRight size={13} />
                    </Link>
                  ) : (
                    <span className="unavailable">Unavailable</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      </Panel>
    </>
  );
}
