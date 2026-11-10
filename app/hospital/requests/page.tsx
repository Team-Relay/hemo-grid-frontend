import { Plus } from "lucide-react";
import { ButtonLink, PageHeader } from "@/components/ui/core";
import { RequestTable } from "@/features/requests/request-table";
export default function HospitalRequests() {
  return (
    <>
      <PageHeader
        eyebrow="Hospital operations"
        title="Blood requests"
        description="Create, monitor and track every request from your hospital."
        action={
          <ButtonLink href="/hospital/requests/new">
            <Plus size={15} /> Emergency request
          </ButtonLink>
        }
      />
      <RequestTable />
    </>
  );
}
