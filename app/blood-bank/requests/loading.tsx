/** Preserves the provider queue layout while assigned requests are being loaded. */

import { PageHeader, Panel, SkeletonRows } from "@/components/ui/core";
export default function ProviderRequestsLoading() {
  return (
    <>
      <PageHeader
        eyebrow="Fulfilment queue"
        title="Incoming requests"
        description="Loading assigned requests…"
      />
      <Panel padding={false}>
        <SkeletonRows />
      </Panel>
    </>
  );
}
