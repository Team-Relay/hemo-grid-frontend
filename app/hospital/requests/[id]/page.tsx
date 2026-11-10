/** Loads one hospital-owned request and delegates lifecycle rendering to the detail view. */

import { notFound } from "next/navigation";

import { PageHeader } from "@/components/ui/core";
import {
  MetadataCard,
  ProviderCard,
  RequestHero,
  RequestTimeline,
} from "@/components/ui/request-detail";
import { HospitalRequestActions } from "@/features/requests/hospital-request-actions";
import { RequestDetailPoller } from "@/features/requests/request-detail-poller";
import { ApiClientError } from "@/lib/api/errors";
import { getHospitalRequest } from "@/lib/data/hospital";
import { requestIdSchema } from "@/lib/validation/blood-request";

export default async function HospitalRequestDetail({
  params,
}: PageProps<"/hospital/requests/[id]">) {
  const { id } = await params;

  if (!requestIdSchema.safeParse(id).success) {
    notFound();
  }

  let request;
  try {
    request = await getHospitalRequest(id);
  } catch (error) {
    if (error instanceof ApiClientError && error.status === 404) {
      notFound();
    }
    throw error;
  }

  return (
    <>
      <RequestDetailPoller status={request.status} />
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
