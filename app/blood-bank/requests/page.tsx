import { PageHeader } from "@/components/ui/core";
import { RequestTable } from "@/features/requests/request-table";
export default function ProviderRequestsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Fulfilment queue"
        title="Incoming requests"
        description="Review assigned requests and progress accepted fulfilments."
      />
      <RequestTable scope="provider" />
    </>
  );
}
