import { PageHeader } from "@/components/ui/core";
import { RequestTable } from "@/features/requests/request-table";
import { bloodRequests } from "@/lib/mock/data";
export default function AdminRequests() {
  return (
    <>
      <PageHeader
        eyebrow="Network monitoring"
        title="Blood requests"
        description="Operational view of requests and transfers across the HemoGrid network."
      />
      <RequestTable requests={bloodRequests} scope="admin" />
    </>
  );
}
