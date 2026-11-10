/** Last-resort route error UI for failures outside a role-specific boundary. */

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { Button, ErrorState, Panel } from "@/components/ui/core";

export default function ApplicationError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="grid min-h-screen place-items-center bg-canvas px-5">
      <Panel className="w-full max-w-xl">
        <ErrorState
          title="HemoGrid could not load this page"
          description="The service may be temporarily unavailable. Retry the request or return to sign in."
          onRetry={reset}
        />
        <div className="mt-4 flex justify-center">
          <Button type="button" variant="secondary" onClick={() => router.push("/login")}>
            Return to sign in
          </Button>
        </div>
      </Panel>
    </main>
  );
}
