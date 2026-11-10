import { Boxes } from "lucide-react";
import { ButtonLink, PageHeader } from "@/components/ui/core";
import { InventoryTable } from "@/features/inventory/inventory-table";
export default function InventoryPage() {
  return (
    <>
      <PageHeader
        eyebrow="Maitama Blood Centre"
        title="Inventory"
        description="Manage screened blood stock, reservations and free availability."
        action={
          <ButtonLink href="#inventory-table">
            <Boxes size={15} />
            Update inventory
          </ButtonLink>
        }
      />
      <InventoryTable />
    </>
  );
}
