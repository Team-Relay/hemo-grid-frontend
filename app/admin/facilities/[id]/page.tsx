import { Activity, Boxes, Building2, FileHeart, MapPin } from "lucide-react";
import { notFound } from "next/navigation";

import { NetworkMap } from "@/components/network/network-map";
import { PageHeader, Panel, SectionHeader, StatCard } from "@/components/ui/core";
import { organizations } from "@/lib/mock/data";

export function generateStaticParams() {
  return organizations.map((organization) => ({ id: organization.id }));
}

export default async function FacilityDetail({ params }: PageProps<"/admin/facilities/[id]">) {
  const { id } = await params;
  const facility = organizations.find((organization) => organization.id === id);

  if (!facility) notFound();

  return (
    <>
      <PageHeader
        backHref="/admin/facilities"
        eyebrow={facility.type === "HOSPITAL" ? "Hospital" : "Blood bank"}
        title={facility.name}
        description={`${facility.location} · network facility profile`}
      />
      <div className="stats-grid facility-stats">
        <StatCard
          label="Network status"
          value={facility.networkStatus === "ONLINE" ? "Online" : "Degraded"}
          detail={facility.lastUpdated}
          icon={Activity}
          tone={facility.networkStatus === "ONLINE" ? "success" : "warning"}
        />
        <StatCard
          label="Active requests"
          value={facility.activeRequests}
          detail="current"
          icon={FileHeart}
        />
        <StatCard
          label="Visible inventory"
          value={facility.totalStock ?? "—"}
          detail={facility.totalStock ? "units" : "not applicable"}
          icon={Boxes}
        />
        <StatCard
          label="Facility type"
          value={facility.type === "HOSPITAL" ? "Hospital" : "Blood bank"}
          detail="verified"
          icon={Building2}
        />
      </div>
      <div className="network-page-grid facility-detail-grid">
        <NetworkMap compact selectedId={facility.id} />
        <Panel>
          <SectionHeader
            title="Facility information"
            description="Current network directory record"
          />
          <div className="provider-card-title">
            <span className="provider-mark">
              {facility.name
                .split(" ")
                .map((word) => word[0])
                .slice(0, 2)
                .join("")}
            </span>
            <div>
              <strong>{facility.name}</strong>
              <span>
                <MapPin size={12} /> {facility.location}
              </span>
            </div>
          </div>
          <div className="info-list">
            <div className="info-row">
              <span>Organization ID</span>
              <strong>{facility.id}</strong>
            </div>
            <div className="info-row">
              <span>Facility type</span>
              <strong>{facility.type === "HOSPITAL" ? "Hospital" : "Blood bank"}</strong>
            </div>
            <div className="info-row">
              <span>Network status</span>
              <strong className="online-text">
                <i /> {facility.networkStatus.toLowerCase()}
              </strong>
            </div>
            <div className="info-row">
              <span>Last synchronized</span>
              <strong>{facility.lastUpdated}</strong>
            </div>
            <div className="info-row">
              <span>Active requests</span>
              <strong>{facility.activeRequests}</strong>
            </div>
            <div className="info-row">
              <span>Total stock</span>
              <strong>
                {facility.totalStock ? `${facility.totalStock} units` : "Not applicable"}
              </strong>
            </div>
          </div>
        </Panel>
      </div>
    </>
  );
}
