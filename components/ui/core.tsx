import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowLeft, ArrowRight, Inbox, LoaderCircle, RefreshCw } from "lucide-react";
import type { BloodGroup, BloodRequestStatus, RequestUrgency, StockHealth } from "@/types/domain";
import { formatBloodGroup, formatStatus, formatUrgency } from "@/lib/domain";

export { ButtonLink } from "@/components/ui/pending-link";

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
  const baseClasses = "inline-flex items-center justify-center gap-2 rounded-full border border-transparent font-semibold transition-transform duration-160 ease-in-out disabled:opacity-55 disabled:cursor-not-allowed disabled:transform-none aria-busy:cursor-wait aria-busy:pointer-events-none hover:-translate-y-[1px]";
  const sizeClasses = {
    sm: "min-h-[34px] px-[11px] text-[12px]",
    md: "min-h-[40px] px-4 text-[13px]"
  };
  const variantClasses = {
    primary: "text-[#fff] bg-brand border-brand hover:bg-brand-dark",
    secondary: "text-ink bg-white border-border-strong hover:bg-surface-muted",
    danger: "text-[#fff] bg-critical border-critical",
    ghost: "text-muted bg-transparent hover:text-ink hover:bg-surface-muted"
  };

  return (
    <button
      className={cn(baseClasses, sizeClasses[size], variantClasses[variant], className)}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      {...props}
    >
      {isLoading ? (
        <>
          <LoaderCircle className="animate-[spin_700ms_linear_infinite] shrink-0" size={15} strokeWidth={1.9} />
          <span>{loadingText}</span>
        </>
      ) : (
        children
      )}
    </button>
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
        className
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
          <Link href={backHref} className="inline-flex items-center gap-[5px] mb-2.5 text-muted text-xs font-semibold hover:text-ink">
            <ArrowLeft size={15} /> Back
          </Link>
        )}
        {eyebrow && <p className="m-0 mb-1.5 text-brand text-[11px] font-[720] tracking-[0.09em] uppercase">{eyebrow}</p>}
        <h1 className="m-0 text-[clamp(25px,2vw,31px)] leading-[1.15] tracking-[-0.035em] font-[640]">{title}</h1>
        {description && <p className="max-w-[660px] m-0 mt-[7px] text-muted leading-[1.55]">{description}</p>}
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
    brand: "text-brand",
    success: "text-success",
    warning: "text-warning",
    critical: "text-critical"
  };

  return (
    <Panel className="min-w-0 min-h-[112px] p-[17px] relative rounded-card" padding={false}>
      <div className={cn("w-[34px] h-[34px] grid place-items-center absolute right-[15px] top-[15px] rounded-full border-none bg-surface-muted", toneMap[tone])}>
        <Icon size={17} strokeWidth={1.8} />
      </div>
      <p className="max-w-[calc(100%-34px)] min-h-[29px] m-0 text-muted text-[11.5px] leading-[1.35] font-semibold">{label}</p>
      <div className="flex items-end gap-2 mt-3">
        <strong className="text-[34px] leading-none font-medium tracking-[-0.04em] tabular-nums">{value}</strong>
        <span>{detail}</span>
      </div>
    </Panel>
  );
}

export function StatusBadge({ status }: { status: BloodRequestStatus }) {
  const statusClasses: Record<BloodRequestStatus, string> = {
    REQUESTED: "text-info bg-info-soft",
    ACCEPTED: "text-[#07845a] bg-success-soft",
    PREPARING: "text-[#7655c6] bg-[#f1ecff]",
    IN_TRANSIT: "text-brand bg-brand-soft",
    DELIVERED: "text-success bg-success-soft",
    DECLINED: "text-critical bg-critical-soft",
    CANCELLED: "text-muted bg-[#eef1f0]",
    EXPIRED: "text-muted bg-[#eef1f0]"
  };

  return (
    <span className={cn("w-max inline-flex items-center gap-1.5 px-2 py-[5px] rounded-full text-[10.5px] font-semibold whitespace-nowrap", statusClasses[status])}>
      <i className="w-[5px] h-[5px] rounded-full bg-current" />
      {formatStatus(status)}
    </span>
  );
}

export function UrgencyBadge({ urgency }: { urgency: RequestUrgency }) {
  const urgencyClasses: Record<RequestUrgency, string> = {
    ROUTINE: "text-muted bg-[#eef1f0]",
    URGENT: "text-warning bg-warning-soft",
    CRITICAL: "text-critical bg-critical-soft"
  };

  return (
    <span className={cn("w-max inline-flex items-center gap-1.5 px-2 py-[5px] rounded-full text-[10.5px] font-semibold whitespace-nowrap", urgencyClasses[urgency])}>
      <i className="w-[5px] h-[5px] rounded-full bg-current" />
      {formatUrgency(urgency)}
    </span>
  );
}

export function StockBadge({ health }: { health: StockHealth }) {
  const stockClasses: Record<StockHealth, string> = {
    HEALTHY: "text-success bg-success-soft",
    MODERATE: "text-info bg-info-soft",
    LOW: "text-warning bg-warning-soft",
    CRITICAL: "text-critical bg-critical-soft"
  };

  return (
    <span className={cn("w-max inline-flex items-center gap-1.5 px-2 py-[5px] rounded-full text-[10.5px] font-semibold whitespace-nowrap", stockClasses[health])}>
      <i className="w-[5px] h-[5px] rounded-full bg-current" />
      {health.charAt(0) + health.slice(1).toLowerCase()}
    </span>
  );
}

export function BloodBadge({ group, large = false }: { group: BloodGroup; large?: boolean }) {
  return (
    <span className={cn(
      "inline-grid place-items-center shrink-0 text-brand-dark bg-brand-soft border border-[#dedfff] rounded-[10px] font-bold",
      large ? "w-[42px] h-[42px] text-base" : "w-[34px] h-[34px] text-[12.5px]"
    )}>
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

export function ErrorState({ onRetry }: { onRetry?: () => void } = {}) {
  return (
    <div className="min-h-[220px] flex flex-col items-center justify-center p-8 border border-dashed border-critical/30 rounded-[18px] text-center bg-critical-soft/50">
      <span className="w-11 h-11 grid place-items-center mb-3.5 rounded-full bg-critical-soft text-critical">
        <RefreshCw size={21} />
      </span>
      <h3 className="m-0 mb-1.5 text-ink text-sm font-semibold tracking-[-0.01em]">We couldn&apos;t load this view</h3>
      <p className="max-w-[280px] m-0 mb-5 text-muted text-xs leading-[1.55]">Check your connection and try again.</p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
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
