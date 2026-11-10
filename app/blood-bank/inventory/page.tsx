/** Live inventory route for the authenticated blood-bank organization. */

import { Boxes } from "lucide-react";
import { ButtonLink, PageHeader } from "@/components/ui/core";
import { InventoryTable } from "@/features/inventory/inventory-table";
import { getProviderInventoryData } from "@/lib/data/provider";

export default async function InventoryPage() {
  const { organization, inventory } = await getProviderInventoryData();

  return (
    <>
      <PageHeader
        eyebrow={organization.name}
        title="Inventory"
        description="Manage screened blood stock, reservations and free availability."
        action={
          <ButtonLink href="#inventory-table">
            <Boxes size={15} />
            Update inventory
          </ButtonLink>
        }
      />
      <InventoryTable items={inventory} />
    </>
  );
}
