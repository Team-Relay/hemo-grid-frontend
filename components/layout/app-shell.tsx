/** Shared authenticated shell with role-aware navigation, direct backend sync, and explicit outage status. */

"use client";

import {
  Boxes,
  Building2,
  CircleGauge,
  Command,
  FileHeart,
  Menu,
  Network,
  WifiOff,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import { ShellTools } from "@/components/layout/shell-tools";
import { Button, FeedbackBanner, cn } from "@/components/ui/core";
import { getCurrentUser } from "@/lib/api/auth";
import type { BackendUser, UserRole } from "@/lib/api/backend-types";
import {
  getBloodRequest,
  getBloodRequestCandidates,
  listBloodRequests,
} from "@/lib/api/blood-requests";
import { listInventory } from "@/lib/api/inventory";
import { getCurrentOrganization } from "@/lib/api/organizations";
import { getProviderRequest, listProviderRequests } from "@/lib/api/provider-requests";
import { getClientAccessToken } from "@/lib/auth/client-session";

export type AppRole = "hospital" | "blood-bank" | "admin";

export interface NavigationItem {
  label: string;
  href: string;
  icon: typeof CircleGauge;
}

const roleConfig = {
  hospital: {
    items: [
      { label: "Dashboard", href: "/hospital/dashboard", icon: CircleGauge },
      { label: "Requests", href: "/hospital/requests", icon: FileHeart },
      { label: "Network", href: "/hospital/network", icon: Network },
    ],
    action: { label: "Emergency request", href: "/hospital/requests/new" },
  },
  "blood-bank": {
    items: [
      { label: "Dashboard", href: "/blood-bank/dashboard", icon: CircleGauge },
      { label: "Requests", href: "/blood-bank/requests", icon: FileHeart },
      { label: "Inventory", href: "/blood-bank/inventory", icon: Boxes },
    ],
    action: {
      label: "Update inventory",
      href: "/blood-bank/inventory#inventory-table",
    },
  },
  admin: {
    items: [
      { label: "Command centre", href: "/admin/dashboard", icon: Command },
      { label: "Facilities", href: "/admin/facilities", icon: Building2 },
      { label: "Network inventory", href: "/admin/inventory", icon: Boxes },
      { label: "Requests", href: "/admin/requests", icon: FileHeart },
    ],
    action: null,
  },
} satisfies Record<
  AppRole,
  {
    items: NavigationItem[];
    action: { label: string; href: string } | null;
  }
>;

const roleLabels: Record<UserRole, string> = {
  PLATFORM_ADMIN: "Platform administrator",
  HOSPITAL_ADMIN: "Hospital administrator",
  HOSPITAL_STAFF: "Hospital staff",
  BLOOD_BANK_ADMIN: "Blood bank administrator",
  BLOOD_BANK_STAFF: "Blood bank staff",
};

function initialsFor(fullName: string): string {
  return (
    fullName
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "HG"
  );
}

/**
 * Mirrors route reads directly from the browser to the Spring Boot backend
 * (`http://localhost:8080/api/v1` locally or the Render URL in production)
 * so every workspace view is visibly backed by the Java API in DevTools Network.
 */
async function syncRouteWithBackend(pathname: string, accessToken: string): Promise<void> {
  if (pathname === "/hospital/dashboard") {
    await Promise.allSettled([
      getCurrentOrganization(accessToken),
      listBloodRequests(accessToken),
    ]);
    return;
  }

  if (pathname === "/hospital/requests") {
    await listBloodRequests(accessToken);
    return;
  }

  if (pathname === "/hospital/requests/new" || pathname === "/hospital/network") {
    await getCurrentOrganization(accessToken);
    return;
  }

  const hospitalMatchesRoute = pathname.match(/^\/hospital\/requests\/([^/]+)\/matches$/);
  if (hospitalMatchesRoute?.[1]) {
    const requestId = hospitalMatchesRoute[1];
    await Promise.allSettled([
      getBloodRequest(accessToken, requestId),
      getBloodRequestCandidates(accessToken, requestId),
    ]);
    return;
  }

  const hospitalDetailRoute = pathname.match(/^\/hospital\/requests\/([^/]+)$/);
  if (hospitalDetailRoute?.[1]) {
    await getBloodRequest(accessToken, hospitalDetailRoute[1]);
    return;
  }

  if (pathname === "/blood-bank/dashboard") {
    await Promise.allSettled([
      getCurrentOrganization(accessToken),
      listProviderRequests(accessToken),
      listInventory(accessToken),
    ]);
    return;
  }

  if (pathname === "/blood-bank/requests") {
    await listProviderRequests(accessToken);
    return;
  }

  if (pathname === "/blood-bank/inventory") {
    await Promise.allSettled([
      getCurrentOrganization(accessToken),
      listInventory(accessToken),
    ]);
    return;
  }

  const providerDetailRoute = pathname.match(/^\/blood-bank\/requests\/([^/]+)$/);
  if (providerDetailRoute?.[1]) {
    await Promise.allSettled([
      getProviderRequest(accessToken, providerDetailRoute[1]),
      listInventory(accessToken),
    ]);
    return;
  }

  await getCurrentUser(accessToken);
}

export function Wordmark({
  href = "/login",
  variant = "pill",
}: {
  href?: string;
  variant?: "pill" | "plain";
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center text-[15px] font-semibold tracking-[-0.025em]",
        variant === "pill" ? "h-10 px-5 text-white bg-ink rounded-full" : "h-auto text-ink",
      )}
      aria-label="HemoGrid home"
    >
      HemoGrid
    </Link>
  );
}

export function AppShell({
  role,
  user,
  serviceUnavailable = false,
  children,
}: {
  role: AppRole;
  user: BackendUser;
  serviceUnavailable?: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false);
  const [isRetrying, startRetryTransition] = useTransition();

  useEffect(() => {
    const accessToken = getClientAccessToken();
    if (!accessToken) return;
    void syncRouteWithBackend(pathname, accessToken).catch(() => {
      // Non-blocking browser telemetry/read verification; SSR boundary handles errors.
    });
  }, [pathname]);

  const config = {
    ...roleConfig[role],
    organization: user.organization?.name ?? "HemoGrid Network",
    roleLabel: roleLabels[user.role],
    initials: initialsFor(user.fullName),
    fullName: user.fullName,
    email: user.email,
  };

  return (
    <div className="min-h-screen">
      <header className="h-[72px] flex items-center gap-4 px-[clamp(24px,3.25vw,56px)] bg-canvas/80 backdrop-blur-md sticky top-0 z-50">
        <Wordmark href={config.items[0].href} />

        <nav
          className={cn("flex gap-[7px] items-center flex-1", mobileNavigationOpen && "flex")}
          aria-label="Main navigation"
        >
          <div className="hidden">
            <span>Navigation</span>
            <button
              type="button"
              onClick={() => setMobileNavigationOpen(false)}
              aria-label="Close navigation"
            >
              <X size={20} strokeWidth={1.8} />
            </button>
          </div>

          {config.items.map(({ label, href, icon: Icon }) => {
            const active =
              pathname === href || (href.endsWith("requests") && pathname.startsWith(`${href}/`));

            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "h-10 inline-flex items-center gap-[7px] px-4 rounded-full text-[13px] font-[550] transition-transform duration-180 ease-in-out whitespace-nowrap shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:-translate-y-[1px]",
                  active
                    ? "bg-ink text-[#fff] hover:bg-ink hover:text-[#fff]"
                    : "text-muted bg-surface hover:bg-surface-muted hover:text-ink",
                )}
                onClick={() => setMobileNavigationOpen(false)}
              >
                <Icon size={15} strokeWidth={1.8} />
                {label}
              </Link>
            );
          })}
        </nav>

        <ShellTools role={role} config={config} />

        <button
          type="button"
          className="hidden"
          onClick={() => setMobileNavigationOpen(true)}
          aria-label="Open navigation"
        >
          <Menu size={19} strokeWidth={1.8} />
        </button>
      </header>

      {serviceUnavailable && (
        <div className="mx-auto mt-3 w-[calc(100%_-_48px)] max-w-[1540px]">
          <FeedbackBanner
            tone="warning"
            icon={WifiOff}
            role="status"
            title="Live service temporarily unavailable"
            message="Navigation remains available, but live data and submissions cannot be verified."
            action={
              <Button
                type="button"
                variant="secondary"
                size="sm"
                isLoading={isRetrying}
                loadingText="Retrying…"
                onClick={() => startRetryTransition(() => router.refresh())}
              >
                Retry connection
              </Button>
            }
          />
        </div>
      )}

      <main className="w-[min(1540px,100%)] mx-auto pt-7 px-[clamp(24px,3.25vw,56px)] pb-12">
        {children}
      </main>
    </div>
  );
}
