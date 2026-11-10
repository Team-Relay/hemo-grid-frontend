/** Blood-bank dashboard composed from provider requests, inventory, and organization data. */

import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Boxes,
  Clock3,
  FileInput,
  PackageCheck,
  ShieldAlert,
} from "lucide-react";

import {
  BloodBadge,
  ButtonLink,
  EmptyState,
  Panel,
  SectionHeader,
  StatCard,
  StatusBadge,
  StockBadge,
  UrgencyBadge,
} from "@/components/ui/core";
import { ProviderDataPoller } from "@/features/requests/provider-data-poller";
import { getProviderDashboardData } from "@/lib/data/provider";
import { formatBloodGroup, formatComponent, getFreeUnits, getStockHealth } from "@/lib/domain";
import type { BloodRequest, BloodRequestStatus, InventoryItem } from "@/types/domain";

const activeStatuses: readonly BloodRequestStatus[] = [
  "REQUESTED",
  "ACCEPTED",
  "PREPARING",
  "IN_TRANSIT",
];

export default async function BloodBankDashboard() {
  const { organization, requests, inventory } = await getProviderDashboardData();
  const activeRequests = requests.filter((request) => activeStatuses.includes(request.status));
  const incomingRequests = requests.filter((request) => request.status === "REQUESTED");
  const criticalRequests = incomingRequests.filter((request) => request.urgency === "CRITICAL");
  const priorityRequest = criticalRequests[0] ?? incomingRequests[0] ?? activeRequests[0];
  const unitsAvailable = inventory.reduce((sum, item) => sum + item.availableUnits, 0);
  const unitsReserved = inventory.reduce((sum, item) => sum + item.reservedUnits, 0);
  const lowStock = [...inventory]
    .filter((item) => ["LOW", "CRITICAL"].includes(getStockHealth(getFreeUnits(item))))
    .sort((left, right) => getFreeUnits(left) - getFreeUnits(right))[0];

  return (
    <div className="space-y-6">
      <ProviderDataPoller enabled={activeRequests.length > 0} />

      <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-5 items-start">
        <div className="space-y-5">
          <Panel className="flex flex-wrap items-center justify-between gap-4 p-6">
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-bold tracking-tight text-ink">{organization.name}</h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-brand-soft text-brand-dark border border-brand/20">
                  Blood Bank
                </span>
              </div>
              <div className="flex items-center gap-2 mt-2 text-xs text-muted">
                <Clock3 size={14} />
                <span>{organization.city ?? organization.state ?? organization.address}</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-surface-muted border border-border">
              <span className="text-xs text-muted">Organization status</span>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                  organization.active
                    ? "bg-success-soft text-success border-success/20"
                    : "bg-critical-soft text-critical border-critical/20"
                }`}
              >
                <i className="w-2 h-2 rounded-full bg-current" />
                {organization.active ? "Operational" : "Inactive"}
              </span>
            </div>
          </Panel>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <StatCard
              label="Incoming requests"
              value={incomingRequests.length}
              detail="awaiting action"
              icon={FileInput}
            />
            <StatCard
              label="Critical requests"
              value={criticalRequests.length}
              detail="needs action"
              icon={ShieldAlert}
              tone="critical"
            />
            <StatCard
              label="Units available"
              value={unitsAvailable}
              detail={`${inventory.length} inventory rows`}
              icon={Boxes}
              tone="success"
            />
            <StatCard
              label="Units reserved"
              value={unitsReserved}
              detail="active allocations"
              icon={PackageCheck}
              tone="warning"
            />
          </div>

          {priorityRequest ? (
            <PriorityRequest request={priorityRequest} />
          ) : (
            <Panel>
              <EmptyState
                title="No assigned requests"
                description="Hospital requests selected for this blood bank will appear here."
              />
            </Panel>
          )}
        </div>

        <Panel className="p-6 space-y-5">
          <SectionHeader
            title="Inventory health"
            description="Free screened units ready for dispatch"
            action={
              <Link
                href="/blood-bank/inventory"
                className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:text-brand-dark transition-colors"
              >
                Full inventory <ArrowRight size={13} />
              </Link>
            }
          />

          {inventory.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {inventory.slice(0, 4).map((item) => (
                <InventoryHealthCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No inventory data"
              description="Seed or add inventory rows for this blood bank."
            />
          )}

          {lowStock && (
            <div className="p-4 rounded-2xl bg-warning-soft/60 border border-warning/30 flex items-start gap-3 text-xs">
              <AlertTriangle size={18} className="text-warning shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold text-ink block">
                  {formatBloodGroup(lowStock.bloodGroup)} {formatComponent(lowStock.component)} is{" "}
                  {getStockHealth(getFreeUnits(lowStock)).toLowerCase()}
                </strong>
                <p className="text-slate-600 text-[11.5px] mt-0.5 leading-relaxed">
                  {getFreeUnits(lowStock)} free units remain after current reservations.
                </p>
              </div>
            </div>
          )}
        </Panel>
      </div>

      <Panel className="p-6">
        <SectionHeader
          title="Recent fulfilment activity"
          description={`Latest requests assigned to ${organization.name}`}
        />
        {requests.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mt-4">
            {requests.slice(0, 4).map((request) => (
              <Link
                href={`/blood-bank/requests/${request.id}`}
                key={request.id}
                className="group p-4 rounded-2xl bg-white border border-border shadow-sm hover:border-brand/40 hover:shadow-md transition-all duration-150 flex flex-col justify-between"
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <strong className="text-xs font-semibold text-ink group-hover:text-brand transition-colors line-clamp-1">
                    {request.hospitalName}
                  </strong>
                  <UrgencyBadge urgency={request.urgency} />
                </div>
                <div className="flex items-center gap-3 my-2">
                  <BloodBadge group={request.bloodGroup} />
                  <div className="min-w-0">
                    <strong className="block text-xs font-bold text-ink truncate">
                      {formatComponent(request.component)} · {request.units} units
                    </strong>
                    <span className="text-[11px] text-muted truncate block">
                      {request.reference}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 mt-2 border-t border-border text-[11px] text-muted">
                  <StatusBadge status={request.status} />
                  <span className="text-[10.5px]">{request.updatedAt}</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No fulfilment activity yet"
            description="Assigned provider requests will appear here."
          />
        )}
      </Panel>
    </div>
  );
}

function PriorityRequest({ request }: { request: BloodRequest }) {
  return (
    <Panel className="p-6 border-critical/30 bg-gradient-to-b from-critical-soft/30 via-white to-white shadow-sm relative overflow-hidden">
      <div className="flex items-center justify-between gap-2 mb-4">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-critical text-white shadow-sm">
          <AlertTriangle size={13} /> Priority request
        </span>
        <StatusBadge status={request.status} />
      </div>
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <span className="text-[11px] font-bold text-brand uppercase tracking-wider">
            {request.reference}
          </span>
          <h2 className="text-xl font-bold tracking-tight text-ink mt-0.5">
            {request.hospitalName}
          </h2>
          <p className="text-xs text-muted mt-0.5">Updated {request.updatedAt}</p>
        </div>
        <UrgencyBadge urgency={request.urgency} />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-surface-muted border border-border my-4">
        <div className="flex items-center gap-3.5">
          <BloodBadge group={request.bloodGroup} large />
          <div>
            <strong className="block text-sm font-bold text-ink">
              {formatBloodGroup(request.bloodGroup)} {formatComponent(request.component)}
            </strong>
            <span className="text-xs font-semibold text-critical">
              {request.units} units required
            </span>
          </div>
        </div>
        <span className="text-[11px] text-muted">Assigned to your fulfilment queue</span>
      </div>
      <div className="flex items-center justify-end gap-3 pt-2">
        <ButtonLink href={`/blood-bank/requests/${request.id}`} variant="secondary">
          Review request
        </ButtonLink>
        <ButtonLink href={`/blood-bank/requests/${request.id}`} variant="primary">
          Open actions <ArrowRight size={14} />
        </ButtonLink>
      </div>
    </Panel>
  );
}

function InventoryHealthCard({ item }: { item: InventoryItem }) {
  const free = getFreeUnits(item);
  const percentage =
    item.availableUnits === 0 ? 0 : Math.min(100, (free / item.availableUnits) * 100);
  return (
    <div className="p-4 rounded-2xl bg-white border border-border shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <BloodBadge group={item.bloodGroup} />
        <StockBadge health={getStockHealth(free)} />
      </div>
      <div>
        <h3 className="text-xs font-semibold text-ink">
          {formatBloodGroup(item.bloodGroup)}{" "}
          <span className="font-normal text-muted">{formatComponent(item.component)}</span>
        </h3>
        <div className="flex items-baseline gap-1.5 mt-1">
          <strong className="text-2xl font-bold text-ink tabular-nums">{free}</strong>
          <span className="text-xs text-muted">free units</span>
        </div>
      </div>
      <div className="w-full h-1.5 bg-surface-muted rounded-full overflow-hidden border border-border/40">
        <div className="h-full bg-brand rounded-full" style={{ width: `${percentage}%` }} />
      </div>
      <div className="text-[10.5px] text-muted flex items-center justify-between">
        <span>{item.availableUnits} available</span>
        <span>{item.reservedUnits} reserved</span>
      </div>
    </div>
  );
}
