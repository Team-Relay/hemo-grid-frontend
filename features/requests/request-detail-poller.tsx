/** Refreshes active request details only while the tab is visible and the status is non-terminal. */

"use client";

import { useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";

import type { BloodRequestStatus } from "@/types/domain";

const terminalStatuses: readonly BloodRequestStatus[] = [
  "DELIVERED",
  "DECLINED",
  "CANCELLED",
  "EXPIRED",
];

/** Refreshes active request details without replacing local page UI state. */
export function RequestDetailPoller({ status }: { status: BloodRequestStatus }) {
  const router = useRouter();
  const [isRefreshing, startTransition] = useTransition();
  const terminal = terminalStatuses.includes(status);

  useEffect(() => {
    if (terminal) return;

    const refresh = () => {
      if (document.visibilityState === "visible" && !isRefreshing) {
        startTransition(() => router.refresh());
      }
    };

    const interval = window.setInterval(refresh, 5_000);
    document.addEventListener("visibilitychange", refresh);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [isRefreshing, router, terminal]);

  return null;
}
