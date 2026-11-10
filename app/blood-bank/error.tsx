/** Provider-wide retry boundary for authenticated data-loading failures. */

"use client";

import { ErrorState, PageHeader, Panel } from "@/components/ui/core";

export default function BloodBankError({ reset }: { reset: () => void }) {
  return (
    <>
      <PageHeader eyebrow="Provider operations" title="Workspace unavailable" />
      <Panel>
        <ErrorState
          description="We could not reach the provider service. Your inventory and request data have not been changed."
          onRetry={reset}
        />
      </Panel>
    </>
  );
}
