/** Live inventory route for the authenticated blood-bank organization. */

import { PageHeader } from "@/components/ui/core";
import { InventoryTable } from "@/features/inventory/inventory-table";
import { UpdateInventoryHeaderButton } from "@/features/inventory/update-inventory-header-button";
import { getProviderInventoryData } from "@/lib/data/provider";

export default async function InventoryPage() {
  const { organization, inventory } = await getProviderInventoryData();

  return (
    <>
      <PageHeader
        eyebrow={organization.name}
        title="Inventory"
        description="Manage screened blood stock, reservations and free availability."
        action={<UpdateInventoryHeaderButton />}
      />
      <InventoryTable items={inventory} />
    </>
  );
}
