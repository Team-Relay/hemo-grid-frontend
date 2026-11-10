/** Quietly refreshes blood-bank reads while active work may change. */

"use client";

import { useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";

export function ProviderDataPoller({ enabled = true }: { enabled?: boolean }) {
  const router = useRouter();
  const refreshing = useRef(false);
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (!enabled) return;

    const refresh = () => {
      if (document.visibilityState !== "visible" || refreshing.current) return;
      refreshing.current = true;
      startTransition(() => {
        router.refresh();
        refreshing.current = false;
      });
    };

    const interval = window.setInterval(refresh, 5_000);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [enabled, router]);

  return null;
}
