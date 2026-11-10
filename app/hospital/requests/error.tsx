"use client";
import { PageHeader, Panel, ErrorState } from "@/components/ui/core";
export default function RequestsError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <>
      <PageHeader eyebrow="Hospital operations" title="Blood requests" />
      <Panel>
        <ErrorState onRetry={reset} />
      </Panel>
    </>
  );
}
