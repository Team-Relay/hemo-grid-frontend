import { ArrowRight, Building2, MapPin } from "lucide-react";
import { NetworkMap } from "@/components/network/network-map";
import { ButtonLink, PageHeader, Panel } from "@/components/ui/core";
import { candidates } from "@/lib/mock/data";
export default function HospitalNetworkPage() {
  return (
    <>
      <PageHeader
        eyebrow="Live coverage"
        title="Blood network"
        description="Verified blood banks available to receive requests from Central Care Hospital."
        action={
          <ButtonLink href="/hospital/requests/new">
            Create request <ArrowRight size={14} />
          </ButtonLink>
        }
      />
      <div className="network-page-grid">
        <NetworkMap compact />
        <Panel>
          <div className="section-heading">
            <div>
              <h2>Nearby blood banks</h2>
              <p>Live facility connectivity</p>
            </div>
          </div>
          <div className="facility-list">
            {candidates.map((c, i) => (
              <div className="facility-list-item" key={c.organizationId}>
                <span className="facility-icon">
                  <Building2 size={16} />
                </span>
                <div>
                  <strong>{c.organizationName}</strong>
                  <p>
                    <MapPin size={11} />
                    {c.location} · {c.distanceKm} km
                  </p>
                </div>
                <span className="facility-online">
                  <i />
                  {i === 3 ? "Degraded" : "Online"}
                </span>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </>
  );
}
