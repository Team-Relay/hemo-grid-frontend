/** Real provider queue for the authenticated blood bank. */

import { PageHeader } from "@/components/ui/core";
import { ProviderDataPoller } from "@/features/requests/provider-data-poller";
import { RequestTable } from "@/features/requests/request-table";
import { getProviderRequests } from "@/lib/data/provider";

export default async function ProviderRequestsPage() {
  const requests = await getProviderRequests();
  const hasActiveRequests = requests.some((request) =>
    ["REQUESTED", "ACCEPTED", "PREPARING", "IN_TRANSIT"].includes(request.status),
  );

  return (
    <>
      <ProviderDataPoller enabled={hasActiveRequests} />
      <PageHeader
        eyebrow="Fulfilment queue"
        title="Incoming requests"
        description="Review assigned requests and progress accepted fulfilments."
      />
      <RequestTable requests={requests} scope="provider" />
    </>
  );
}
