/** Kenya Blood Network topology and corridor telemetry overview for hospital teams. */

"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Clock3,
  ExternalLink,
  MapPin,
  Radio,
  ShieldCheck,
  Zap,
} from "lucide-react";

import { NetworkMap } from "@/components/network/network-map";
import {
  ButtonLink,
  cn,
  ColdChainBadge,
  FeedbackBanner,
  PageHeader,
  Panel,
} from "@/components/ui/core";
import { candidates } from "@/lib/mock/data";

export default function HospitalNetworkPage() {
  const [selectedHubId, setSelectedHubId] = useState<string>("bank-1");
  const [filter, setFilter] = useState<"ALL" | "FASTEST" | "VERIFIED">("ALL");

  const filteredCandidates = useMemo(() => {
    return candidates.filter((c) => {
      if (filter === "FASTEST") {
        return (c.estimatedTransitHours ?? 99) <= 3.0;
      }
      if (filter === "VERIFIED") {
        return (
          c.coldChainVerified &&
          c.fridgeTempCelsius !== undefined &&
          c.fridgeTempCelsius <= 5.0
        );
      }
      return true;
    });
  }, [filter]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Live Network Coverage"
        title="Regional blood network"
        description="Verified RBTCs, satellite blood banks, and peer hospital transfusion units connected across the active regional road-corridor network."
        action={
          <ButtonLink href="/hospital/requests/new">
            Create emergency request <ArrowRight size={14} />
          </ButtonLink>
        }
      />

      <FeedbackBanner
        tone="info"
        title="Corridor Optimization Active (2,162 Verified Road Routes)"
        message="HemoGrid dynamically routes emergency shortfalls across the 6 Regional Blood Transfusion Centres (RBTCs) and 9 Satellite banks—cutting median road transit ETA from 5.11h to 2.51h."
      />

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
        {/* Left Column: Interactive Network Map */}
        <div className="xl:col-span-7 flex flex-col space-y-4">
          <div className="flex-1 rounded-3xl overflow-hidden border border-border shadow-sm">
            <NetworkMap selectedId={selectedHubId} />
          </div>

          <div className="p-4 rounded-2xl bg-white border border-border flex flex-wrap items-center justify-between gap-3 text-xs text-muted shadow-sm">
            <div className="flex items-center gap-2 text-ink font-semibold">
              <Zap size={14} className="text-amber-500" />
              <span>National Blood Grid Telemetry</span>
            </div>
            <div className="flex items-center gap-4 text-[11.5px]">
              <span className="flex items-center gap-1.5">
                <i className="w-2.5 h-2.5 rounded-full bg-brand" /> 6 Regional RBTC Hubs
              </span>
              <span className="flex items-center gap-1.5">
                <i className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Cold-Chain Verified
              </span>
              <span className="flex items-center gap-1.5">
                <i className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Excursion Alert
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Connected Fulfilment Hubs Panel */}
        <div className="xl:col-span-5 flex flex-col">
          <Panel className="p-6 flex flex-col h-full shadow-sm space-y-4">
            {/* Header & Live Pulse */}
            <div className="flex flex-wrap items-start justify-between gap-2 pb-3 border-b border-border">
              <div>
                <h2 className="text-base font-bold text-ink tracking-tight">
                  Connected Fulfilment Hubs
                </h2>
                <p className="text-xs text-muted mt-0.5">
                  Click any hub to highlight and inspect on the network map.
                </p>
              </div>

              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold">
                <Radio size={12} className="animate-pulse text-emerald-600" />
                Live Telemetry
              </span>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-surface-muted border border-border text-xs">
              <button
                type="button"
                onClick={() => setFilter("ALL")}
                className={cn(
                  "flex-1 py-1.5 px-2.5 rounded-lg font-semibold text-[11px] transition-all",
                  filter === "ALL"
                    ? "bg-white text-ink shadow-sm"
                    : "text-muted hover:text-ink hover:bg-white/50",
                )}
              >
                All Hubs ({candidates.length})
              </button>
              <button
                type="button"
                onClick={() => setFilter("FASTEST")}
                className={cn(
                  "flex-1 py-1.5 px-2.5 rounded-lg font-semibold text-[11px] transition-all",
                  filter === "FASTEST"
                    ? "bg-white text-ink shadow-sm"
                    : "text-muted hover:text-ink hover:bg-white/50",
                )}
              >
                Fastest (&le;3h)
              </button>
              <button
                type="button"
                onClick={() => setFilter("VERIFIED")}
                className={cn(
                  "flex-1 py-1.5 px-2.5 rounded-lg font-semibold text-[11px] transition-all",
                  filter === "VERIFIED"
                    ? "bg-white text-ink shadow-sm"
                    : "text-muted hover:text-ink hover:bg-white/50",
                )}
              >
                Verified Cold-Chain
              </button>
            </div>

            {/* Hub Cards List */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[560px]">
              {filteredCandidates.map((c) => {
                const isSelected = selectedHubId === c.organizationId;
                const isDegraded =
                  !c.coldChainVerified ||
                  (c.fridgeTempCelsius !== undefined && c.fridgeTempCelsius > 5.0);

                return (
                  <div
                    key={c.organizationId}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedHubId(c.organizationId)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelectedHubId(c.organizationId);
                      }
                    }}
                    className={cn(
                      "p-4 rounded-2xl bg-white border transition-all duration-150 cursor-pointer space-y-3 text-left",
                      isSelected
                        ? "border-brand ring-2 ring-brand/20 shadow-md bg-brand-soft/20"
                        : "border-border hover:border-brand/40 hover:shadow-sm",
                    )}
                  >
                    {/* Top Row: Facility Code & Telemetry Status */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-brand-soft text-brand-dark border border-brand/20 font-mono text-[10.5px] font-bold uppercase tracking-wider">
                          {c.facilityCode}
                        </span>
                        <span className="text-[10.5px] font-semibold text-slate-500 uppercase tracking-wide">
                          {c.facilityTier === "RBTC"
                            ? "Regional Transfusion Hub"
                            : "Satellite Blood Bank"}
                        </span>
                      </div>

                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold",
                          isDegraded
                            ? "bg-amber-50 text-amber-800 border border-amber-200"
                            : "bg-emerald-50 text-emerald-700 border border-emerald-200",
                        )}
                      >
                        <i
                          className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            isDegraded ? "bg-amber-500" : "bg-emerald-500 animate-pulse",
                          )}
                        />
                        {isDegraded ? "Degraded Telemetry" : "Online & Dispatch Ready"}
                      </span>
                    </div>

                    {/* Middle Row: Facility Name & Road Corridor */}
                    <div>
                      <h3 className="text-sm font-bold text-ink tracking-tight leading-snug">
                        {c.organizationName}
                      </h3>
                      <div className="flex items-center gap-1.5 text-[11.5px] text-muted mt-1">
                        <MapPin size={12} className="text-brand shrink-0" />
                        <span className="truncate">{c.location}</span>
                        <span className="text-slate-300 shrink-0">•</span>
                        <span className="font-semibold text-slate-700 shrink-0">
                          {c.distanceKm} km away
                        </span>
                      </div>
                    </div>

                    {/* Bottom Row: Key Telemetry Metrics Strip */}
                    <div className="pt-2.5 border-t border-border flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 text-white font-bold text-[11px] tracking-tight">
                        <Clock3 size={11} className="text-brand-light shrink-0" />
                        <span>~{c.estimatedTransitHours}h road ETA</span>
                      </div>

                      <div className="text-[11px] text-slate-600">
                        Free stock: <strong className="text-ink font-bold">{c.unitsFree} units</strong>
                      </div>

                      <ColdChainBadge
                        verified={c.coldChainVerified}
                        tempCelsius={c.fridgeTempCelsius}
                      />
                    </div>

                    {/* Bottom Action Hint if Selected */}
                    {isSelected && (
                      <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[11px]">
                        <span className="text-brand font-medium flex items-center gap-1">
                          <ShieldCheck size={13} /> Selected on network map
                        </span>
                        <Link
                          href="/hospital/requests/new"
                          onClick={(e) => e.stopPropagation()}
                          className="font-bold text-brand hover:underline inline-flex items-center gap-1"
                        >
                          Request from this hub <ExternalLink size={11} />
                        </Link>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
