/** Refreshes active request details via direct Spring Boot polling while the tab is visible. */

"use client";

import { useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";

import { getBloodRequest } from "@/lib/api/blood-requests";
import { getClientAccessToken } from "@/lib/auth/client-session";
import type { BloodRequestStatus } from "@/types/domain";

const terminalStatuses: readonly BloodRequestStatus[] = [
  "DELIVERED",
  "DECLINED",
  "CANCELLED",
  "EXPIRED",
];

/** Polls the Spring Boot request endpoint directly and refreshes local page UI state. */
export function RequestDetailPoller({
  requestId,
  status,
}: {
  requestId?: string;
  status: BloodRequestStatus;
}) {
  const router = useRouter();
  const [isRefreshing, startTransition] = useTransition();
  const terminal = terminalStatuses.includes(status);

  useEffect(() => {
    if (terminal) return;

    const refresh = async () => {
      if (document.visibilityState !== "visible" || isRefreshing) return;

      const accessToken = getClientAccessToken();
      if (accessToken && requestId) {
        try {
          await getBloodRequest(accessToken, requestId);
        } catch {
          // Allow router.refresh() to handle auth or outage state transitions cleanly.
        }
      }

      startTransition(() => router.refresh());
    };

    const interval = window.setInterval(refresh, 5_000);
    document.addEventListener("visibilitychange", refresh);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [isRefreshing, requestId, router, terminal]);

  return null;
}
