/** Hospital-wide fallback that keeps the authenticated application shell visible. */

"use client";

import { ErrorState, PageHeader, Panel } from "@/components/ui/core";

export default function HospitalError({ reset }: { reset: () => void }) {
  return (
    <>
      <PageHeader eyebrow="Hospital operations" title="Live data unavailable" />
      <Panel>
        <ErrorState
          title="We couldn't reach the HemoGrid service"
          description="The interface is still available, but live requests and inventory cannot be loaded until the backend reconnects."
          onRetry={reset}
        />
      </Panel>
    </>
  );
}
