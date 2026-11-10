"use client";

import {
  ArrowRight,
  Bell,
  CheckCheck,
  ChevronDown,
  Clock3,
  LoaderCircle,
  LogOut,
  Plus,
  Search,
  UserRound,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useFormStatus } from "react-dom";

import { logoutAction } from "@/app/actions/auth";
import type { AppRole, NavigationItem } from "@/components/layout/app-shell";
import { cn } from "@/components/ui/core";
import { PendingLink } from "@/components/ui/pending-link";

interface ShellConfig {
  organization: string;
  roleLabel: string;
  initials: string;
  fullName: string;
  email: string;
  items: NavigationItem[];
  action: { label: string; href: string } | null;
}

type OpenPanel = "search" | "notifications" | "profile" | null;

function SessionActionButton({
  icon: Icon,
  label,
  pendingLabel,
}: {
  icon: typeof LogOut;
  label: string;
  pendingLabel: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="min-h-[38px] flex w-full items-center gap-[9px] border-0 bg-transparent px-[9px] text-left text-[#465350] rounded-[8px] text-[10.5px] hover:text-ink hover:bg-surface-muted disabled:cursor-wait disabled:opacity-60"
    >
      {pending ? (
        <LoaderCircle
          size={15}
          strokeWidth={1.8}
          className="animate-[spin_700ms_linear_infinite]"
        />
      ) : (
        <Icon size={15} strokeWidth={1.8} />
      )}
      {pending ? pendingLabel : label}
    </button>
  );
}

const notifications = [
  {
    title: "Critical request accepted",
    detail: "Maitama Blood Centre reserved 3 O− red cell units.",
    time: "2 min ago",
    href: "/hospital/requests/req-0142",
    tone: "success",
  },
  {
    title: "Transfer is in transit",
    detail: "HG-2026-0140 is expected in approximately 18 minutes.",
    time: "14 min ago",
    href: "/hospital/requests/req-0140",
    tone: "info",
  },
  {
    title: "AB− availability is low",
    detail: "Only 14 free units are visible across the network.",
    time: "22 min ago",
    href: "/hospital/network",
    tone: "warning",
  },
];

function rolePath(role: AppRole, path: string) {
  if (role === "hospital") return path;
  if (role === "blood-bank") {
    return path.includes("/network")
      ? "/blood-bank/inventory"
      : path.replace("/hospital", "/blood-bank");
  }
  return path.includes("/network") ? "/admin/inventory" : path.replace("/hospital", "/admin");
}

export function ShellTools({ role, config }: { role: AppRole; config: ShellConfig }) {
  const [openPanel, setOpenPanel] = useState<OpenPanel>(null);
  const [query, setQuery] = useState("");
  const [hasUnread, setHasUnread] = useState(true);
  const toolsRef = useRef<HTMLDivElement>(null);

  const searchItems = useMemo(
    () => [
      ...config.items.map((item) => ({
        ...item,
        description: `Open ${item.label.toLowerCase()}`,
      })),
      ...(config.action
        ? [
            {
              label: config.action.label,
              href: config.action.href,
              icon: Plus,
              description: "Start the primary operational workflow",
            },
          ]
        : []),
    ],
    [config],
  );

  const filteredItems = searchItems.filter((item) =>
    `${item.label} ${item.description}`.toLowerCase().includes(query.toLowerCase()),
  );

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      if (!toolsRef.current?.contains(event.target as Node)) setOpenPanel(null);
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpenPanel(null);
    }

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  function togglePanel(panel: Exclude<OpenPanel, null>) {
    setOpenPanel((current) => (current === panel ? null : panel));
    if (panel !== "search") setQuery("");
  }

  return (
    <div className="flex items-center gap-2 relative ml-auto" ref={toolsRef}>
      {config.action && (
        <PendingLink
          href={config.action.href}
          className="h-10 inline-flex items-center gap-2 px-[17px] rounded-full text-[#fff] bg-brand text-[12.5px] font-[650] shadow-[0_2px_8px_rgba(91,92,226,0.18)] transition-transform duration-180 ease-in-out whitespace-nowrap hover:bg-brand-dark hover:-translate-y-[1px]"
          pendingLabel="Opening…"
        >
          {config.action.label}
          <Plus size={15} strokeWidth={1.8} />
        </PendingLink>
      )}

      <div className="relative">
        <button
          type="button"
          className={cn(
            "w-10 h-10 inline-grid place-items-center border-none rounded-full text-muted bg-surface shadow-[0_2px_8px_rgba(0,0,0,0.02)] relative transition-all duration-160 ease-in-out hover:bg-surface-muted hover:text-ink hover:-translate-y-[1px]",
            openPanel === "search" && "text-[#fff] bg-ink hover:bg-ink hover:text-[#fff]",
          )}
          onClick={() => togglePanel("search")}
          aria-label="Search HemoGrid"
          aria-expanded={openPanel === "search"}
        >
          <Search size={17} strokeWidth={1.8} />
        </button>

        {openPanel === "search" && (
          <div
            className="absolute top-[calc(100%+13px)] right-0 z-[80] overflow-hidden border border-border rounded-[15px] bg-white shadow-[0_18px_48px_rgba(29,42,38,0.14)] w-[min(430px,calc(100vw-32px))]"
            role="dialog"
            aria-label="Search HemoGrid"
          >
            <div className="min-h-[56px] flex items-center gap-[10px] px-[14px] text-muted border-b border-border">
              <Search size={17} strokeWidth={1.8} />
              <input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search pages and actions"
                aria-label="Search pages and actions"
                className="min-w-0 flex-1 border-0 outline-0 text-ink bg-transparent text-[13px]"
              />
              <button
                type="button"
                onClick={() => setOpenPanel(null)}
                aria-label="Close search"
                className="w-[30px] h-[30px] grid place-items-center text-muted border-0 rounded-lg bg-surface-muted"
              >
                <X size={15} />
              </button>
            </div>
            <div className="max-h-[360px] overflow-y-auto p-2">
              <span className="block px-[9px] py-2 pb-1.5 text-muted text-[9.5px] font-bold tracking-[0.06em] uppercase">
                Quick navigation
              </span>
              {filteredItems.length > 0 ? (
                filteredItems.map(({ label, href, icon: Icon, description }) => (
                  <Link
                    key={`${label}-${href}`}
                    href={href}
                    onClick={() => setOpenPanel(null)}
                    className="min-h-[56px] flex items-center gap-[10px] p-2 px-[9px] rounded-[10px] hover:bg-surface-muted"
                  >
                    <span className="w-[34px] h-[34px] grid place-items-center shrink-0 text-ink border border-border rounded-[10px] bg-white">
                      <Icon size={16} strokeWidth={1.8} />
                    </span>
                    <span className="min-w-0 flex flex-1 flex-col">
                      <strong className="text-[11.5px]">{label}</strong>
                      <small className="mt-[3px] text-muted text-[10px]">{description}</small>
                    </span>
                    <ArrowRight size={14} strokeWidth={1.8} className="text-muted-2" />
                  </Link>
                ))
              ) : (
                <div className="p-4 py-6 text-muted text-[11px] text-center">
                  No pages or actions match “{query}”.
                </div>
              )}
            </div>
            <div className="text-muted-2 border-t border-border bg-surface-muted text-[9.5px] py-[9px] px-[14px]">
              Press Esc to close
            </div>
          </div>
        )}
      </div>

      <div className="relative">
        <button
          type="button"
          className={cn(
            "w-10 h-10 inline-grid place-items-center border-none rounded-full text-muted bg-surface shadow-[0_2px_8px_rgba(0,0,0,0.02)] relative transition-all duration-160 ease-in-out hover:bg-surface-muted hover:text-ink hover:-translate-y-[1px]",
            openPanel === "notifications" && "text-[#fff] bg-ink hover:bg-ink hover:text-[#fff]",
          )}
          onClick={() => togglePanel("notifications")}
          aria-label="Open notifications"
          aria-expanded={openPanel === "notifications"}
        >
          <Bell size={17} strokeWidth={1.8} />
          {hasUnread && (
            <i className="w-[7px] h-[7px] absolute right-[7px] top-[6px] border-2 border-white bg-critical rounded-full box-content" />
          )}
        </button>

        {openPanel === "notifications" && (
          <div className="absolute top-[calc(100%+13px)] right-0 z-[80] overflow-hidden border border-border rounded-[15px] bg-white shadow-[0_18px_48px_rgba(29,42,38,0.14)] w-[min(390px,calc(100vw-32px))]">
            <div className="min-h-[66px] flex items-center justify-between gap-4 p-3 px-[14px] border-b border-border">
              <div className="flex flex-col">
                <strong className="text-[13px]">Notifications</strong>
                <span className="mt-[3px] text-muted text-[9.5px]">
                  {hasUnread ? "3 unread updates" : "You are up to date"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setHasUnread(false)}
                disabled={!hasUnread}
                className="inline-flex items-center gap-[5px] p-1.5 text-brand bg-transparent text-[9.5px] font-[650] border-none disabled:text-muted-2 disabled:cursor-default"
              >
                <CheckCheck size={14} /> Mark all read
              </button>
            </div>
            <div className="grid">
              {notifications.map((notification) => (
                <Link
                  href={rolePath(role, notification.href)}
                  key={notification.title}
                  onClick={() => {
                    setHasUnread(false);
                    setOpenPanel(null);
                  }}
                  className="grid grid-cols-[8px_1fr] gap-[9px] p-[13px] px-[14px] border-b border-[#edf1ef] last:border-0 hover:bg-surface-muted"
                >
                  <span
                    className={cn(
                      "w-[7px] h-[7px] mt-1 rounded-full",
                      notification.tone === "success"
                        ? "bg-success"
                        : notification.tone === "info"
                          ? "bg-info"
                          : "bg-warning",
                    )}
                  />
                  <span className="flex flex-col">
                    <strong className="text-[11px]">{notification.title}</strong>
                    <small className="mt-[3px] text-muted text-[9.5px] leading-[1.45]">
                      {notification.detail}
                    </small>
                    <time className="inline-flex items-center gap-1 mt-[7px] text-muted-2 text-[9px]">
                      <Clock3 size={11} /> {notification.time}
                    </time>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="relative">
        <button
          type="button"
          className={cn(
            "flex items-center gap-[9px] max-w-[205px] h-10 p-1 pl-1 pr-3 bg-surface shadow-[0_2px_8px_rgba(0,0,0,0.02)] border-0 rounded-full text-left transition-all duration-[160ms] ease-in-out hover:bg-surface-muted hover:-translate-y-[1px]",
            openPanel === "profile" && "bg-surface-muted -translate-y-[1px]",
          )}
          onClick={() => togglePanel("profile")}
          aria-label="Open user menu"
          aria-expanded={openPanel === "profile"}
        >
          <span className="w-[34px] h-[34px] grid place-items-center shrink-0 text-[#fff] bg-[#37433f] rounded-full text-[11px] font-bold">
            {config.initials}
          </span>
          <span className="flex flex-col min-w-0">
            <strong className="overflow-hidden text-ellipsis text-[11.5px] whitespace-nowrap">
              {config.organization}
            </strong>
            <small className="mt-[2px] text-muted text-[10.5px]">{config.roleLabel}</small>
          </span>
          <ChevronDown size={14} strokeWidth={1.8} />
        </button>

        {openPanel === "profile" && (
          <div className="absolute top-[calc(100%+13px)] right-0 z-[80] overflow-hidden border border-border rounded-[15px] bg-white shadow-[0_18px_48px_rgba(29,42,38,0.14)] w-[260px]">
            <div className="flex items-center gap-[10px] p-[15px] border-b border-border">
              <span className="w-[36px] h-[36px] grid place-items-center shrink-0 text-[#fff] rounded-full bg-ink text-[10px] font-bold">
                {config.initials}
              </span>
              <div className="min-w-0 flex flex-col">
                <strong className="overflow-hidden text-[11px] text-ellipsis whitespace-nowrap">
                  {config.fullName}
                </strong>
                <small className="mt-[3px] overflow-hidden text-ellipsis whitespace-nowrap text-muted text-[9.5px]">
                  {config.email}
                </small>
              </div>
            </div>
            <div className="grid p-[7px]">
              <form action={logoutAction}>
                <SessionActionButton
                  icon={UserRound}
                  label="Switch workspace"
                  pendingLabel="Switching…"
                />
              </form>
              <form action={logoutAction}>
                <SessionActionButton icon={LogOut} label="Sign out" pendingLabel="Signing out…" />
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
