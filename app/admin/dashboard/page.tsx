import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Building2,
  PackageOpen,
  Radio,
  Route,
  ShieldAlert,
} from "lucide-react";
import { NetworkMap } from "@/components/network/network-map";
import { Panel, SectionHeader, StatCard } from "@/components/ui/core";
import { activities } from "@/lib/mock/data";

const availability = [
  { g: "O+", n: 256, s: "Healthy", p: 88 },
  { g: "O−", n: 31, s: "Low", p: 28 },
  { g: "A+", n: 211, s: "Healthy", p: 76 },
  { g: "A−", n: 63, s: "Healthy", p: 58 },
  { g: "B+", n: 168, s: "Healthy", p: 69 },
  { g: "B−", n: 47, s: "Moderate", p: 43 },
  { g: "AB+", n: 92, s: "Healthy", p: 62 },
  { g: "AB−", n: 14, s: "Critical", p: 14 },
];
export default function AdminDashboard() {
  return (
    <>
      <div className="command-head">
        <div>
          <p className="eyebrow">Network operations</p>
          <h1>Command Centre</h1>
          <p>Real-time availability and emergency fulfilment across the HemoGrid network.</p>
        </div>
        <div className="command-live">
          <span>
            <i />
            Live network
          </span>
          <small>Last synchronized just now</small>
        </div>
      </div>
      <div className="stats-grid admin-stats">
        <StatCard label="Participating facilities" value="18" detail="17 online" icon={Building2} />
        <StatCard
          label="Total free units"
          value="1,284"
          detail="across network"
          icon={PackageOpen}
          tone="success"
        />
        <StatCard
          label="Active critical requests"
          value="4"
          detail="2 awaiting"
          icon={ShieldAlert}
          tone="critical"
        />
        <StatCard label="Active transfers" value="7" detail="3 arriving soon" icon={Route} />
      </div>
      <div className="admin-grid">
        <NetworkMap />
        <div className="detail-stack">
          <Panel className="availability-panel">
            <SectionHeader
              title="Blood availability"
              description="Free units across all connected facilities"
              action={
                <Link href="/admin/inventory" className="text-link">
                  Inspect <ArrowRight size={12} />
                </Link>
              }
            />
            <div className="availability-grid">
              {availability.map((item) => (
                <div className="availability-item" key={item.g}>
                  <strong>{item.g}</strong>
                  <div>
                    <span>
                      <b>{item.n}</b> units
                    </span>
                    <div className="availability-track">
                      <i
                        className={`availability-${item.s.toLowerCase()}`}
                        style={{ width: `${item.p}%` }}
                      />
                    </div>
                  </div>
                  <small className={`availability-text-${item.s.toLowerCase()}`}>{item.s}</small>
                </div>
              ))}
            </div>
          </Panel>
          <Panel className="alerts-panel">
            <SectionHeader
              title="Critical stock alerts"
              description="Conditions requiring network attention"
            />
            <div className="alert-list">
              <div>
                <span className="alert-icon critical">
                  <AlertTriangle size={15} />
                </span>
                <p>
                  <strong>AB− Whole Blood</strong>
                  <small>14 units across 2 facilities</small>
                </p>
                <b>Critical</b>
              </div>
              <div>
                <span className="alert-icon warning">
                  <Radio size={15} />
                </span>
                <p>
                  <strong>O− Red Cells</strong>
                  <small>31 units · demand elevated</small>
                </p>
                <b>Low</b>
              </div>
            </div>
          </Panel>
        </div>
      </div>
      <Panel className="network-activity">
        <SectionHeader
          title="Recent network activity"
          description="Operational events across all participating facilities"
          action={
            <Link href="/admin/requests" className="text-link">
              All requests <ArrowRight size={12} />
            </Link>
          }
        />
        <div className="activity-row">
          {activities.map((item) => (
            <div className="activity-card" key={item.id}>
              <span className={`activity-dot ${item.tone}`}>
                <Activity size={13} />
              </span>
              <div>
                <strong>{item.title}</strong>
                <p>{item.detail}</p>
                <small>{item.timestamp}</small>
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </>
  );
}
