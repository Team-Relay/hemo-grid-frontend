/** Quietly polls Spring Boot blood-bank endpoints and refreshes active views. */

"use client";

import { useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";

import { listProviderRequests } from "@/lib/api/provider-requests";
import { getClientAccessToken } from "@/lib/auth/client-session";

export function ProviderDataPoller({ enabled = true }: { enabled?: boolean }) {
  const router = useRouter();
  const refreshing = useRef(false);
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (!enabled) return;

    const refresh = async () => {
      if (document.visibilityState !== "visible" || refreshing.current) return;
      refreshing.current = true;

      const accessToken = getClientAccessToken();
      if (accessToken) {
        try {
          await listProviderRequests(accessToken);
        } catch {
          // Allow router.refresh() to handle auth or outage state transitions cleanly.
        }
      }

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
