/** Preserves the hospital request-table layout while data is streamed. */

import { PageHeader, Panel, SkeletonRows } from "@/components/ui/core";
export default function RequestsLoading() {
  return (
    <>
      <PageHeader
        eyebrow="Hospital operations"
        title="Blood requests"
        description="Loading request activity…"
      />
      <Panel padding={false}>
        <SkeletonRows />
      </Panel>
    </>
  );
}
