/** Inventory-specific skeleton preserves table layout during server refreshes. */

import { PageHeader, Panel, SkeletonRows } from "@/components/ui/core";

export default function InventoryLoading() {
  return (
    <>
      <PageHeader
        eyebrow="Inventory control"
        title="Blood inventory"
        description="Loading current stock levels…"
      />
      <Panel padding={false}>
        <SkeletonRows />
      </Panel>
    </>
  );
}
