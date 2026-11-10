/** Displays the administrative request-detail prototype until platform APIs are implemented. */

import { PageHeader, Panel, SectionHeader } from "@/components/ui/core";
import {
  MetadataCard,
  ProviderCard,
  RequestHero,
  RequestTimeline,
} from "@/components/ui/request-detail";
import { bloodRequests, getRequest } from "@/lib/mock/data";

export function generateStaticParams() {
  return bloodRequests.map((request) => ({ id: request.id }));
}

export default async function AdminRequestDetail({ params }: PageProps<"/admin/requests/[id]">) {
  const { id } = await params;
  const request = getRequest(id);

  return (
    <>
      <PageHeader
        backHref="/admin/requests"
        eyebrow="Network request"
        title={request.reference}
        description="Read-only operational detail across the hospital and selected provider."
      />
      <div className="grid grid-cols-[minmax(0,1.35fr)_minmax(310px,0.65fr)] gap-4">
        <div className="flex flex-col gap-4">
          <RequestHero request={request} />
          <RequestTimeline request={request} />
          <MetadataCard request={request} />
        </div>
        <aside className="flex flex-col gap-4">
          <ProviderCard request={request} />
          <Panel>
            <SectionHeader title="System notes" />
            <div className="grid">
              <SectionHeader
                title="Network oversight"
                description="Administrative monitoring is read-only in this phase."
              />
              <div className="info-list">
                <div className="info-row">
                  <span>Hospital</span>
                  <strong>{request.hospitalName}</strong>
                </div>
                <div className="flex justify-between gap-5 py-3 border-b border-[#edf1ef] last:border-0 last:pb-0">
                  <span className="text-muted text-[11px]">Audit ID</span>
                  <strong className="text-[11.5px] text-right inline-flex items-center justify-end gap-[5px]">
                    req_audit_0142_xx99
                  </strong>
                </div>
                <div className="flex justify-between gap-5 py-3 border-b border-[#edf1ef] last:border-0 last:pb-0">
                  <span className="text-muted text-[11px]">Flagged</span>
                  <strong className="text-[11.5px] text-right inline-flex items-center justify-end gap-[5px]">
                    No anomalies
                  </strong>
                </div>
              </div>
            </div>
          </Panel>
        </aside>
      </div>
    </>
  );
}
