/** Existing network-map prototype; facility telemetry remains local until a network API exists. */

import { ArrowRight, Building2, MapPin, Radio } from "lucide-react";
import { NetworkMap } from "@/components/network/network-map";
import { ButtonLink, PageHeader, Panel } from "@/components/ui/core";
import { candidates } from "@/lib/mock/data";

export default function HospitalNetworkPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Live Network Coverage"
        title="Regional blood network"
        description="Verified blood banks and screening centres connected to Central Care Hospital for emergency dispatch."
        action={
          <ButtonLink href="/hospital/requests/new">
            Create emergency request <ArrowRight size={14} />
          </ButtonLink>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_0.9fr] gap-5 items-start">
        <NetworkMap compact />

        <Panel className="p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div>
              <h2 className="text-base font-bold text-ink">Connected Fulfilment Hubs</h2>
              <p className="text-xs text-muted mt-0.5">
                Real-time facility telemetry and distance matrix
              </p>
            </div>
            <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
              <Radio size={13} className="animate-pulse" /> Live Telemetry
            </span>
          </div>

          <div className="space-y-3">
            {candidates.map((c, i) => {
              const isDegraded = i === 3;
              return (
                <div
                  key={c.organizationId}
                  className="p-3.5 rounded-2xl bg-white border border-border hover:border-brand/30 hover:shadow-sm transition-all duration-150 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-soft border border-brand/20 grid place-items-center text-brand-dark shrink-0">
                      <Building2 size={18} />
                    </div>
                    <div>
                      <strong className="block text-xs sm:text-sm font-bold text-ink">
                        {c.organizationName}
                      </strong>
                      <span className="text-[11px] text-muted flex items-center gap-1 mt-0.5">
                        <MapPin size={11} className="text-brand" /> {c.location} · {c.distanceKm} km
                      </span>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-semibold ${
                      isDegraded
                        ? "bg-warning-soft text-warning border border-warning/20"
                        : "bg-success-soft text-success border border-success/20"
                    }`}
                  >
                    <i
                      className={`w-1.5 h-1.5 rounded-full ${isDegraded ? "bg-amber-500" : "bg-emerald-500"}`}
                    />
                    {isDegraded ? "Degraded" : "Online"}
                  </span>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>
    </div>
  );
}
