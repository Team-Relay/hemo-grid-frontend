/** Request-detail skeleton shown while the authenticated server read is pending. */

import { PageHeader, Panel, SkeletonRows } from "@/components/ui/core";

export default function RequestDetailLoading() {
  return (
    <>
      <PageHeader
        backHref="/hospital/requests"
        eyebrow="Hospital operations"
        title="Loading request…"
      />
      <div className="grid grid-cols-[minmax(0,1.35fr)_minmax(310px,0.65fr)] gap-4">
        <div className="grid gap-4">
          <Panel padding={false}>
            <SkeletonRows />
          </Panel>
          <Panel padding={false}>
            <SkeletonRows />
          </Panel>
        </div>
        <Panel padding={false}>
          <SkeletonRows />
        </Panel>
      </div>
    </>
  );
}
