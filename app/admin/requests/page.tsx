import { PageHeader } from "@/components/ui/core";
import { RequestTable } from "@/features/requests/request-table";
export default function AdminRequests() {
  return (
    <>
      <PageHeader
        eyebrow="Network monitoring"
        title="Blood requests"
        description="Operational view of requests and transfers across the HemoGrid network."
      />
      <RequestTable scope="admin" />
    </>
  );
}
