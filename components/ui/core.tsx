/** Design-system primitives shared across role workspaces to keep states visually consistent. */

import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Inbox,
  Info,
  RefreshCw,
  ShieldCheck,
  ThermometerSnowflake,
  X,
} from "lucide-react";
import type { BloodGroup, BloodRequestStatus, RequestUrgency, StockHealth } from "@/types/domain";
import { formatBloodGroup, formatStatus, formatUrgency } from "@/lib/domain";
import { ActionLink, ButtonLink, LoadingSpinner, PendingLink } from "@/components/ui/pending-link";

export { ActionLink, ButtonLink, LoadingSpinner, PendingLink };

export function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md";
  isLoading?: boolean;
  loadingText?: string;
};

export function Button({
  children,
  className,
  disabled,
  isLoading = false,
  loadingText = "Please wait…",
  variant = "primary",
  size = "md",
  ...props
}: ButtonProps) {
  const baseClasses =
    "inline-flex items-center justify-center gap-2 rounded-full border border-transparent font-semibold transition-transform duration-160 ease-in-out disabled:opacity-55 disabled:cursor-not-allowed disabled:transform-none aria-busy:cursor-wait aria-busy:pointer-events-none hover:-translate-y-[1px]";
  const sizeClasses = {
    sm: "min-h-[34px] px-[11px] text-[12px]",
    md: "min-h-[40px] px-4 text-[13px]",
  };
  const variantClasses = {
    primary: "text-[#fff] bg-brand border-brand hover:bg-brand-dark",
    secondary: "text-ink bg-white border-border-strong hover:bg-surface-muted",
    danger: "text-[#fff] bg-critical border-critical",
    ghost: "text-muted bg-transparent hover:text-ink hover:bg-surface-muted",
  };

  return (
    <button
      className={cn(baseClasses, sizeClasses[size], variantClasses[variant], className)}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      {...props}
    >
      {isLoading ? <LoadingSpinner size={15} label={loadingText} /> : children}
    </button>
  );
}

export type FeedbackTone = "critical" | "warning" | "success" | "info";

export function FeedbackBanner({
  tone = "critical",
  title,
  message,
  icon: CustomIcon,
  onDismiss,
  action,
  role,
  className,
}: {
  tone?: FeedbackTone;
  title?: string;
  message: React.ReactNode;
  icon?: LucideIcon;
  onDismiss?: () => void;
  action?: React.ReactNode;
  role?: "alert" | "status" | "note";
  className?: string;
}) {
  const toneStyles: Record<
    FeedbackTone,
    { container: string; icon: string; DefaultIcon: LucideIcon }
  > = {
    critical: {
      container: "border-critical/25 bg-critical-soft/60 text-slate-700",
      icon: "text-critical",
      DefaultIcon: AlertTriangle,
    },
    warning: {
      container: "border-warning/25 bg-warning-soft/70 text-slate-700",
      icon: "text-warning",
      DefaultIcon: AlertTriangle,
    },
    success: {
      container: "border-success/30 bg-success-soft text-emerald-800",
      icon: "text-success",
      DefaultIcon: CheckCircle2,
    },
    info: {
      container: "border-info/30 bg-info-soft text-slate-800",
      icon: "text-info",
      DefaultIcon: Info,
    },
  };

  const config = toneStyles[tone];
  const Icon = CustomIcon ?? config.DefaultIcon;
  const resolvedRole = role ?? (tone === "critical" ? "alert" : "status");

  return (
    <div
      className={cn(
        "flex items-start justify-between gap-3 rounded-2xl border px-4 py-3 text-xs",
        config.container,
        className,
      )}
      role={resolvedRole}
    >
      <div className="flex items-start gap-2.5 min-w-0 flex-1">
        <Icon size={16} className={cn("mt-0.5 shrink-0", config.icon)} />
        <div className="min-w-0 flex-1">
          {title ? (
            <>
              <strong className="block font-semibold text-ink">{title}</strong>
              <div className="mt-0.5 leading-relaxed">{message}</div>
            </>
          ) : (
            <span className="font-semibold leading-relaxed block">{message}</span>
          )}
        </div>
      </div>

      {action && <div className="shrink-0 self-center">{action}</div>}

      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss notice"
          className="shrink-0 rounded-lg p-1 text-current opacity-75 hover:opacity-100 transition-opacity"
        >
          <X size={15} />
        </button>
      )}
    </div>
  );
}

export function FieldError({
  id,
  message,
  className,
}: {
  id?: string;
  message?: string;
  className?: string;
}) {
  if (!message) return null;

  return (
    <p
      id={id}
      role="alert"
      className={cn("m-0 mt-1.5 text-[10.5px] font-medium text-critical", className)}
    >
      {message}
    </p>
  );
}

export function ColdChainBadge({
  verified,
  tempCelsius,
  quarantinedUnits = 0,
}: {
  verified?: boolean;
  tempCelsius?: number;
  quarantinedUnits?: number;
}) {
  if (verified === undefined && quarantinedUnits === 0) {
    return (
      <span className="w-max inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-surface-muted text-muted border border-border leading-none h-fit">
        <ThermometerSnowflake size={12} className="shrink-0" />
        Cold-chain status unavailable
      </span>
    );
  }

  if (!verified || quarantinedUnits > 0) {
    return (
      <span className="w-max inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap bg-warning-soft text-amber-800 border border-warning/30 leading-none h-fit">
        <ThermometerSnowflake size={12} className="text-warning shrink-0" />
        {quarantinedUnits > 0
          ? `${quarantinedUnits} Excursion Quarantined`
          : "Cold-chain hold"}
      </span>
    );
  }

  return (
    <span className="w-max inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap bg-success-soft text-emerald-800 border border-success/25 leading-none h-fit">
      <ThermometerSnowflake size={12} className="text-success shrink-0" />
      2°C–6°C Verified{tempCelsius !== undefined ? ` (${tempCelsius.toFixed(1)}°C)` : ""}
    </span>
  );
}

export function MatchTypeBadge({
  matchType,
  offeredGroup,
}: {
  matchType?: "EXACT" | "COMPATIBLE_SUBSTITUTE";
  offeredGroup?: BloodGroup;
}) {
  if (matchType === undefined) {
    return (
      <span className="w-max inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-surface-muted text-muted border border-border leading-none h-fit">
        <ShieldCheck size={12} className="shrink-0" />
        Group match not confirmed
      </span>
    );
  }

  if (matchType === "COMPATIBLE_SUBSTITUTE") {
    return (
      <span className="w-max inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap bg-info-soft text-info border border-info/25 leading-none h-fit">
        <ShieldCheck size={12} className="shrink-0" />
        ABO/Rh Compatible{offeredGroup ? ` (${formatBloodGroup(offeredGroup)})` : ""}
      </span>
    );
  }

  return (
    <span className="w-max inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap bg-brand-soft text-brand-dark border border-brand/20 leading-none h-fit">
      <ShieldCheck size={12} className="text-brand shrink-0" />
      Exact Group Match
    </span>
  );
}

export function Panel({
  children,
  className,
  padding = true,
}: {
  children: React.ReactNode;
  className?: string;
  padding?: boolean;
}) {
  return (
    <section
      className={cn(
        "border border-border rounded-panel bg-surface shadow-[0_1px_3px_rgba(0,0,0,0.02),0_4px_12px_rgba(0,0,0,0.02)]",
        padding && "p-5",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
  backHref,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  backHref?: string;
}) {
  return (
    <div className="flex min-h-[65px] items-end justify-between gap-6 mb-5">
      <div className="flex-1">
        {backHref && (
          <PendingLink
            href={backHref}
            pendingLabel="Going back…"
            spinnerSize={13}
            className="inline-flex items-center gap-[5px] mb-2.5 text-muted text-xs font-semibold hover:text-ink"
          >
            <ArrowLeft size={15} /> Back
          </PendingLink>
        )}
        {eyebrow && (
          <p className="m-0 mb-1.5 text-brand text-[11px] font-[720] tracking-[0.09em] uppercase">
            {eyebrow}
          </p>
        )}
        <h1 className="m-0 text-[clamp(25px,2vw,31px)] leading-[1.15] tracking-[-0.035em] font-[640]">
          {title}
        </h1>
        {description && (
          <p className="max-w-[660px] m-0 mt-[7px] text-muted leading-[1.55]">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  detail,
  icon: Icon,
  tone = "brand",
}: {
  label: string;
  value: string | number;
  detail: string;
  icon: LucideIcon;
  tone?: "brand" | "success" | "warning" | "critical";
}) {
  const toneMap = {
    brand: "text-brand bg-brand-soft/70 border border-brand/15",
    success: "text-success bg-success-soft border border-success/20",
    warning: "text-warning bg-warning-soft border border-warning/20",
    critical: "text-critical bg-critical-soft border border-critical/20",
  };

  return (
    <Panel className="min-w-0 p-3.5 sm:p-4 rounded-xl flex flex-col justify-between bg-white border border-border shadow-xs" padding={false}>
      <div className="flex items-start justify-between gap-2">
        <p className="m-0 text-slate-500 text-xs font-medium leading-tight">
          {label}
        </p>
        <div
          className={cn(
            "w-7 h-7 grid place-items-center rounded-lg shrink-0",
            toneMap[tone],
          )}
        >
          <Icon size={14} strokeWidth={2} />
        </div>
      </div>
      <div className="mt-2">
        <strong className="text-xl sm:text-2xl font-bold tracking-tight text-ink tabular-nums block">
          {value}
        </strong>
        <p className="mt-0.5 text-[11px] text-slate-400 truncate">{detail}</p>
      </div>
    </Panel>
  );
}

export function StatusBadge({ status }: { status: BloodRequestStatus }) {
  const statusClasses: Record<BloodRequestStatus, string> = {
    REQUESTED: "text-info bg-info-soft border border-info/20",
    ACCEPTED: "text-[#07845a] bg-success-soft border border-success/20",
    PREPARING: "text-[#7655c6] bg-[#f1ecff] border border-brand/20",
    IN_TRANSIT: "text-brand bg-brand-soft border border-brand/20",
    DELIVERED: "text-success bg-success-soft border border-success/20",
    DECLINED: "text-critical bg-critical-soft border border-critical/20",
    CANCELLED: "text-muted bg-[#eef1f0] border border-border",
    EXPIRED: "text-muted bg-[#eef1f0] border border-border",
  };

  return (
    <span
      className={cn(
        "w-max inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap self-start shrink-0 leading-none h-fit",
        statusClasses[status],
      )}
    >
      <i className="w-[5px] h-[5px] rounded-full bg-current shrink-0" />
      {formatStatus(status)}
    </span>
  );
}

export function UrgencyBadge({ urgency }: { urgency: RequestUrgency }) {
  const urgencyClasses: Record<RequestUrgency, string> = {
    ROUTINE: "text-muted bg-[#eef1f0] border border-border",
    URGENT: "text-warning bg-warning-soft border border-warning/20",
    CRITICAL: "text-critical bg-critical-soft border border-critical/20",
  };

  return (
    <span
      className={cn(
        "w-max inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap self-start shrink-0 leading-none h-fit",
        urgencyClasses[urgency],
      )}
    >
      <i className="w-[5px] h-[5px] rounded-full bg-current shrink-0" />
      {formatUrgency(urgency)}
    </span>
  );
}

export function StockBadge({ health, className }: { health: StockHealth; className?: string }) {
  const stockClasses: Record<StockHealth, string> = {
    HEALTHY: "text-success bg-success-soft border border-success/20",
    MODERATE: "text-info bg-info-soft border border-info/20",
    LOW: "text-warning bg-warning-soft border border-warning/20",
    CRITICAL: "text-critical bg-critical-soft border border-critical/20",
  };

  return (
    <span
      className={cn(
        "w-max inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap self-start shrink-0 leading-none h-fit",
        stockClasses[health],
        className,
      )}
    >
      <i className="w-[5px] h-[5px] rounded-full bg-current shrink-0" />
      {health.charAt(0) + health.slice(1).toLowerCase()}
    </span>
  );
}

export function BloodBadge({ group, large = false }: { group: BloodGroup; large?: boolean }) {
  return (
    <span
      className={cn(
        "inline-grid place-items-center shrink-0 text-brand-dark bg-brand-soft border border-[#dedfff] rounded-[10px] font-bold",
        large ? "w-[42px] h-[42px] text-base" : "w-[34px] h-[34px] text-[12.5px]",
      )}
    >
      {formatBloodGroup(group)}
    </span>
  );
}

export function SectionHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 mb-4">
      <div>
        <h2 className="m-0 text-base tracking-[-0.02em] font-semibold">{title}</h2>
        {description && <p className="m-0 mt-[5px] text-muted text-xs">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({
  title = "Nothing to show",
  description = "Items will appear here when they become available.",
  action,
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="min-h-[220px] flex flex-col items-center justify-center p-8 border border-dashed border-border rounded-[18px] text-center">
      <span className="w-11 h-11 grid place-items-center mb-3.5 rounded-full bg-surface-muted text-muted">
        <Inbox size={21} />
      </span>
      <h3 className="m-0 mb-1.5 text-ink text-sm font-semibold tracking-[-0.01em]">{title}</h3>
      <p className="max-w-[280px] m-0 mb-5 text-muted text-xs leading-[1.55]">{description}</p>
      {action}
    </div>
  );
}

export function ErrorState({
  title = "We couldn't load this view",
  description = "Check your connection and try again.",
  onRetry,
  isRetrying = false,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
  isRetrying?: boolean;
} = {}) {
  return (
    <div className="min-h-[220px] flex flex-col items-center justify-center p-8 border border-dashed border-critical/30 rounded-[18px] text-center bg-critical-soft/50">
      <span className="w-11 h-11 grid place-items-center mb-3.5 rounded-full bg-critical-soft text-critical">
        <RefreshCw size={21} />
      </span>
      <h3 className="m-0 mb-1.5 text-ink text-sm font-semibold tracking-[-0.01em]">{title}</h3>
      <p className="max-w-[320px] m-0 mb-5 text-muted text-xs leading-[1.55]">{description}</p>
      {onRetry && (
        <Button
          variant="secondary"
          size="sm"
          onClick={onRetry}
          isLoading={isRetrying}
          loadingText="Retrying…"
        >
          Try again
        </Button>
      )}
    </div>
  );
}

export function TableShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left [&_th]:h-[43px] [&_th]:px-4 [&_th]:text-muted [&_th]:bg-surface-muted [&_th]:border-b [&_th]:border-border [&_th]:text-[10.5px] [&_th]:font-semibold [&_th]:tracking-[0.02em] [&_th]:uppercase [&_th]:whitespace-nowrap [&_td]:h-[59px] [&_td]:px-4 [&_td]:border-b [&_td]:border-border [&_td]:text-ink [&_td]:text-[13px] [&_td]:whitespace-nowrap [&_tr]:transition-colors [&_tr]:duration-140 [&_tr:hover]:bg-surface-muted [&_tr:last-child_td]:border-b-0">
        {children}
      </table>
    </div>
  );
}

export function Pagination({ label = "Showing 1–6 of 24" }: { label?: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-4 px-1.5 mt-2 border-t border-border">
      <span className="text-muted text-[11.5px]">{label}</span>
      <div className="flex items-center gap-2">
        <Button variant="secondary" size="sm" aria-label="Previous page" disabled>
          <ArrowLeft size={15} />
        </Button>
        <span className="min-w-8 text-center text-[12.5px] font-semibold">1</span>
        <Button variant="secondary" size="sm" aria-label="Next page" disabled>
          <ArrowRight size={15} />
        </Button>
      </div>
    </div>
  );
}

export function SkeletonRows() {
  return (
    <div className="grid gap-3 p-4" aria-label="Loading">
      <span className="h-4 bg-border/40 rounded w-full animate-pulse" />
      <span className="h-4 bg-border/40 rounded w-11/12 animate-pulse" />
      <span className="h-4 bg-border/40 rounded w-full animate-pulse" />
      <span className="h-4 bg-border/40 rounded w-10/12 animate-pulse" />
    </div>
  );
}
