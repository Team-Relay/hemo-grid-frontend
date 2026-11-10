"use client";

import { Boxes, Building2, CircleGauge, Command, FileHeart, Menu, Network, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { ShellTools } from "@/components/layout/shell-tools";
import { cn } from "@/components/ui/core";
import type { BackendUser, UserRole } from "@/lib/api/backend-types";

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
  children,
}: {
  role: AppRole;
  user: BackendUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false);
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

      <main className="w-[min(1540px,100%)] mx-auto pt-7 px-[clamp(24px,3.25vw,56px)] pb-12">
        {children}
      </main>
    </div>
  );
}
