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
  Panel,
  SectionHeader,
  StatCard,
  StatusBadge,
  StockBadge,
  UrgencyBadge,
} from "@/components/ui/core";
import { formatBloodGroup, formatComponent, getFreeUnits, getStockHealth } from "@/lib/domain";
import { bloodRequests, inventory } from "@/lib/mock/data";

export default function BloodBankDashboard() {
  const critical = bloodRequests.find((request) => request.id === "req-0138")!;
  return (
    <>
      <div className="bank-dashboard-grid">
        <div className="dashboard-left">
          <Panel className="org-status">
            <div>
              <h1>Maitama Blood Centre</h1>
              <div className="org-meta">
                <span>
                  <Clock3 size={14} />
                </span>
                <div>
                  <small>Inventory synchronized</small>
                  <br />
                  <strong>2 minutes ago</strong>
                </div>
              </div>
            </div>
            <div className="system-state">
              <span>System status</span>
              <strong className="connected-pill">
                <i /> Operational
              </strong>
            </div>
          </Panel>
          <div className="stats-grid">
            <StatCard label="Incoming requests" value="6" detail="3 new" icon={FileInput} />
            <StatCard
              label="Critical requests"
              value="2"
              detail="needs action"
              icon={ShieldAlert}
              tone="critical"
            />
            <StatCard
              label="Units available"
              value="97"
              detail="8 groups"
              icon={Boxes}
              tone="success"
            />
            <StatCard
              label="Units reserved"
              value="22"
              detail="5 transfers"
              icon={PackageCheck}
              tone="warning"
            />
          </div>
          <Panel className="incoming-hero">
            <div className="incoming-label">
              <AlertTriangle size={14} /> Critical request
            </div>
            <div className="incoming-head">
              <div>
                <span className="eyebrow">{critical.reference}</span>
                <h2>{critical.hospitalName}</h2>
                <p>Emergency request received just now</p>
              </div>
              <UrgencyBadge urgency={critical.urgency} />
            </div>
            <div className="incoming-requirement">
              <BloodBadge group={critical.bloodGroup} large />
              <div>
                <strong>
                  {formatBloodGroup(critical.bloodGroup)} {formatComponent(critical.component)}
                </strong>
                <span>{critical.units} units required</span>
              </div>
              <div className="incoming-distance">
                <strong>6.4 km</strong>
                <span>from your facility</span>
              </div>
            </div>
            <div className="incoming-actions">
              <ButtonLink href={`/blood-bank/requests/${critical.id}`} variant="secondary">
                Review request
              </ButtonLink>
              <ButtonLink href={`/blood-bank/requests/${critical.id}`}>
                Accept request <ArrowRight size={14} />
              </ButtonLink>
            </div>
          </Panel>
        </div>
        <Panel className="inventory-snapshot">
          <SectionHeader
            title="Inventory health"
            description="Free screened units by group"
            action={
              <Link href="/blood-bank/inventory" className="text-link">
                Full inventory <ArrowRight size={13} />
              </Link>
            }
          />
          <div className="inventory-mini-grid">
            {inventory.slice(0, 4).map((item) => {
              const free = getFreeUnits(item);
              return (
                <div className="inventory-mini" key={item.id}>
                  <div>
                    <BloodBadge group={item.bloodGroup} />
                    <StockBadge health={getStockHealth(free)} />
                  </div>
                  <h3>
                    {formatBloodGroup(item.bloodGroup)}{" "}
                    <span>{formatComponent(item.component)}</span>
                  </h3>
                  <strong>{free}</strong>
                  <p>free units</p>
                  <div className="stock-bar">
                    <i style={{ width: `${Math.min(100, free * 8)}%` }} />
                  </div>
                  <small>
                    {item.availableUnits} available · {item.reservedUnits} reserved
                  </small>
                </div>
              );
            })}
          </div>
          <div className="stock-warning">
            <AlertTriangle size={16} />
            <div>
              <strong>AB− Whole Blood is critically low</strong>
              <p>2 free units remain. Update inventory after the next screening batch.</p>
            </div>
          </div>
        </Panel>
      </div>
      <Panel className="recent-panel">
        <SectionHeader
          title="Recent fulfilment activity"
          description="Latest requests assigned to Maitama Blood Centre"
        />
        <div className="request-cards">
          {bloodRequests.slice(0, 4).map((request) => (
            <Link
              href={`/blood-bank/requests/${request.id}`}
              key={request.id}
              className="request-card"
            >
              <div className="request-card-top">
                <strong>{request.hospitalName}</strong>
                <UrgencyBadge urgency={request.urgency} />
              </div>
              <div className="request-card-main">
                <BloodBadge group={request.bloodGroup} />
                <div>
                  <strong>
                    {formatComponent(request.component)} · {request.units} units
                  </strong>
                  <span>{request.reference}</span>
                </div>
              </div>
              <div className="request-card-foot">
                <StatusBadge status={request.status} />
                <span>{request.updatedAt}</span>
              </div>
            </Link>
          ))}
        </div>
      </Panel>
    </>
  );
}
