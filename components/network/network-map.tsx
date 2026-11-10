/** Accessible interactive visualization for the Kenya Blood Network dataset. */

"use client";

import { Building2, Cross, LocateFixed, MapPin, Minus, Plus } from "lucide-react";
import { useEffect, useState } from "react";

import { cn } from "@/components/ui/core";
import { organizations } from "@/lib/mock/data";

export function NetworkMap({
  compact = false,
  selectedId = "bank-1",
  title = "Live blood network",
}: {
  compact?: boolean;
  selectedId?: string;
  title?: string;
}) {
  const [selectedFacilityId, setSelectedFacilityId] = useState(selectedId);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    setSelectedFacilityId(selectedId);
  }, [selectedId]);
  const selectedFacility =
    organizations.find((organization) => organization.id === selectedFacilityId) ??
    organizations[1];

  return (
    <section className={cn("network-map", compact && "network-map-compact")} aria-label={title}>
      <div className="map-canvas" style={{ transform: `scale(${zoom})` }}>
        <div className="map-grid" />
        <svg
          className="map-routes"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path d="M52 60 C55 54, 58 50, 60 47" />
          <path d="M52 60 C46 54, 42 52, 33 43" />
          <path d="M60 47 C68 45, 76 44, 83 44" />
          <path d="M21 51 C26 52, 30 54, 34 55" />
        </svg>

        {organizations.slice(0, 10).map((organization) => {
          const selected = organization.id === selectedFacilityId;

          return (
            <div
              key={organization.id}
              className={cn("map-marker-wrap", selected && "marker-selected")}
              style={{
                left: `${organization.coordinates.x}%`,
                top: `${organization.coordinates.y}%`,
              }}
            >
              <button
                type="button"
                className={cn(
                  "map-marker",
                  organization.type === "HOSPITAL" ? "marker-hospital" : "marker-bank",
                  organization.networkStatus === "DEGRADED" && "marker-warning",
                )}
                onClick={() => setSelectedFacilityId(organization.id)}
                aria-label={`Select ${organization.name}`}
                aria-pressed={selected}
              >
                {organization.type === "HOSPITAL" ? (
                  <Cross size={13} strokeWidth={2} />
                ) : (
                  <Building2 size={13} strokeWidth={1.8} />
                )}
              </button>
              {selected && <span className="marker-label">{organization.name}</span>}
            </div>
          );
        })}
      </div>

      <div className="map-topbar">
        <span className="live-label">
          <i /> Live network
        </span>
        <span>National Blood Grid · 47 Connected Facilities</span>
      </div>

      <div className="map-zoom">
        <button
          type="button"
          onClick={() => setZoom((current) => Math.min(1.3, current + 0.1))}
          disabled={zoom >= 1.3}
          aria-label="Zoom in"
        >
          <Plus size={15} strokeWidth={1.8} />
        </button>
        <button
          type="button"
          onClick={() => setZoom((current) => Math.max(0.9, current - 0.1))}
          disabled={zoom <= 0.9}
          aria-label="Zoom out"
        >
          <Minus size={15} strokeWidth={1.8} />
        </button>
        <button
          type="button"
          onClick={() => {
            setZoom(1);
            setSelectedFacilityId(selectedId);
          }}
          aria-label="Reset map view"
        >
          <LocateFixed size={14} strokeWidth={1.8} />
        </button>
      </div>

      <div className="map-legend">
        <span>
          <i className="legend-hospital" />
          <MapPin size={12} strokeWidth={1.8} /> Hospital
        </span>
        <span>
          <i className="legend-bank" /> RBTC / Blood bank
        </span>
        <span>
          <i className="legend-critical" /> Cold-chain / Stock alert
        </span>
      </div>

      {!compact && (
        <div className="map-summary">
          <div>
            <span className="pulse-dot" />
            <p>
              <strong>
                {selectedFacility.name}
                {selectedFacility.facilityCode ? ` (${selectedFacility.facilityCode})` : ""}
              </strong>
              <small>
                {selectedFacility.location} · {selectedFacility.networkStatus.toLowerCase()}
              </small>
            </p>
          </div>
          <span>
            {selectedFacility.type === "BLOOD_BANK"
              ? `${selectedFacility.totalStock ?? "—"} units visible`
              : `${selectedFacility.activeRequests} active requests`}
          </span>
        </div>
      )}
    </section>
  );
}
