/** Hosts the administrative facility-list prototype pending a backend platform endpoint. */

import { PageHeader } from "@/components/ui/core";
import { FacilitiesTable } from "@/features/inventory/facilities-table";
export default function FacilitiesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Network directory"
        title="Facilities"
        description="Monitor hospitals and blood banks participating in the HemoGrid network."
      />
      <FacilitiesTable />
    </>
  );
}
