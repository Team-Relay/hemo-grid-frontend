/** Hosts the network inventory prototype without representing local mock data as live data. */

import { PageHeader } from "@/components/ui/core";
import { NetworkInventoryView } from "@/features/inventory/network-inventory-view";

export default function AdminInventory() {
  return (
    <>
      <PageHeader
        eyebrow="Network-wide visibility"
        title="Network inventory"
        description="Aggregated free units across participating blood banks and components."
      />
      <NetworkInventoryView />
    </>
  );
}
