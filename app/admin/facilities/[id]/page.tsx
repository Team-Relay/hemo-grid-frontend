import { Activity, Boxes, Building2, FileHeart, Hospital, MapPin } from "lucide-react";
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

  const isHospital = facility.type === "HOSPITAL";
  const isOnline = facility.networkStatus === "ONLINE";

  return (
    <div className="space-y-6">
      <PageHeader
        backHref="/admin/facilities"
        eyebrow={isHospital ? "Trauma Hospital" : "Regional Blood Bank"}
        title={facility.name}
        description={`${facility.location} · Verified HemoGrid network facility record`}
      />

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <StatCard
          label="Network status"
          value={isOnline ? "Online" : "Degraded"}
          detail={facility.lastUpdated}
          icon={Activity}
          tone={isOnline ? "success" : "warning"}
        />
        <StatCard
          label="Active requests"
          value={facility.activeRequests}
          detail="in pipeline"
          icon={FileHeart}
        />
        <StatCard
          label="Visible inventory"
          value={facility.totalStock ?? "—"}
          detail={facility.totalStock ? "screened units" : "not applicable"}
          icon={Boxes}
          tone={facility.totalStock ? "success" : "brand"}
        />
        <StatCard
          label="Facility type"
          value={isHospital ? "Hospital" : "Blood bank"}
          detail="verified partner"
          icon={isHospital ? Hospital : Building2}
        />
      </div>

      {/* Map + Detail Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_0.9fr] gap-5 items-start">
        <NetworkMap compact selectedId={facility.id} />

        <Panel className="p-6 space-y-5">
          <SectionHeader
            title="Facility profile"
            description="Verified network directory record and telemetry status"
          />

          <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-surface-muted border border-border">
            <span className="w-12 h-12 rounded-xl bg-brand-soft border border-brand/20 grid place-items-center text-brand-dark font-bold text-sm shrink-0">
              {facility.name
                .split(" ")
                .map((word) => word[0])
                .slice(0, 2)
                .join("")}
            </span>
            <div>
              <strong className="block text-sm font-bold text-ink">{facility.name}</strong>
              <span className="text-xs text-muted flex items-center gap-1 mt-0.5">
                <MapPin size={12} className="text-brand" /> {facility.location}
              </span>
            </div>
          </div>

          <div className="divide-y divide-border text-xs">
            <div className="flex items-center justify-between py-2.5">
              <span className="text-muted font-medium">Organization ID</span>
              <strong className="font-semibold text-ink font-mono">{facility.id}</strong>
            </div>

            <div className="flex items-center justify-between py-2.5">
              <span className="text-muted font-medium">Classification</span>
              <strong className="font-semibold text-ink">
                {isHospital ? "Hospital Trauma Centre" : "Regional Screening Blood Bank"}
              </strong>
            </div>

            <div className="flex items-center justify-between py-2.5">
              <span className="text-muted font-medium">Live Telemetry</span>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                  isOnline
                    ? "bg-success-soft text-success border border-success/20"
                    : "bg-warning-soft text-warning border border-warning/20"
                }`}
              >
                <i className={`w-1.5 h-1.5 rounded-full ${isOnline ? "bg-emerald-500" : "bg-amber-500"}`} />
                {facility.networkStatus}
              </span>
            </div>

            <div className="flex items-center justify-between py-2.5">
              <span className="text-muted font-medium">Last Synchronized</span>
              <strong className="font-semibold text-ink">{facility.lastUpdated}</strong>
            </div>

            <div className="flex items-center justify-between py-2.5">
              <span className="text-muted font-medium">Active Requests</span>
              <strong className="font-semibold text-ink">{facility.activeRequests}</strong>
            </div>

            <div className="flex items-center justify-between py-2.5">
              <span className="text-muted font-medium">Screened Reserves</span>
              <strong className="font-semibold text-ink">
                {facility.totalStock ? `${facility.totalStock} units` : "Not applicable"}
              </strong>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}
