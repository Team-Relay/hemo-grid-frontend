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
