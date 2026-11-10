"use client";

import { ErrorState, PageHeader, Panel } from "@/components/ui/core";

export default function HospitalDashboardError({ reset }: { reset: () => void }) {
  return (
    <>
      <PageHeader eyebrow="Hospital operations" title="Dashboard unavailable" />
      <Panel>
        <ErrorState onRetry={reset} />
      </Panel>
    </>
  );
}
