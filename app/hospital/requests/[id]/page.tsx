import { PageHeader } from "@/components/ui/core";
import {
  MetadataCard,
  ProviderCard,
  RequestHero,
  RequestTimeline,
} from "@/components/ui/request-detail";
import { HospitalRequestActions } from "@/features/requests/hospital-request-actions";
import { getRequest } from "@/lib/mock/data";
export default async function HospitalRequestDetail({
  params,
}: PageProps<"/hospital/requests/[id]">) {
  const { id } = await params;
  const request = getRequest(id);
  return (
    <>
      <PageHeader
        backHref="/hospital/requests"
        title={`Request ${request.reference}`}
        description="Track provider response, reservation and transfer progress."
      />
      <div className="grid grid-cols-[minmax(0,1.35fr)_minmax(310px,0.65fr)] gap-4">
        <div className="flex flex-col gap-4">
          <RequestHero request={request} />
          <RequestTimeline request={request} />
          <MetadataCard request={request} />
        </div>
        <aside className="flex flex-col gap-4">
          <ProviderCard request={request} />
          <HospitalRequestActions request={request} />
        </aside>
      </div>
    </>
  );
}
