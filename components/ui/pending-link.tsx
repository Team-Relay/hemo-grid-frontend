/** Navigation links and action triggers with immediate reusable loading spinners during App Router transitions. */

"use client";

import { LoaderCircle } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export function LoadingSpinner({
  size = 15,
  className = "",
  label,
}: {
  size?: number;
  className?: string;
  label?: string;
}) {
  return (
    <>
      <LoaderCircle
        className={["button-spinner animate-[spin_700ms_linear_infinite] shrink-0", className]
          .filter(Boolean)
          .join(" ")}
        size={size}
        strokeWidth={1.9}
        aria-hidden="true"
      />
      {label ? <span>{label}</span> : null}
    </>
  );
}

type PendingLinkProps = Omit<React.ComponentProps<typeof Link>, "href"> & {
  href: string;
  pendingLabel?: string;
  spinnerSize?: number;
};

export function PendingLink({ ...props }: PendingLinkProps) {
  const pathname = usePathname();

  return <PendingLinkContent key={pathname} {...props} />;
}

function PendingLinkContent({
  children,
  href,
  onClick,
  pendingLabel = "Opening…",
  spinnerSize = 15,
  ...props
}: PendingLinkProps) {
  const [pending, setPending] = useState(false);
  const fallbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (fallbackTimer.current) clearTimeout(fallbackTimer.current);
    },
    [],
  );

  return (
    <Link
      href={href}
      aria-busy={pending || undefined}
      onClick={(event) => {
        onClick?.(event);

        if (
          event.defaultPrevented ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey ||
          props.target === "_blank" ||
          href.startsWith("#")
        ) {
          return;
        }

        const destination = new URL(href, window.location.href);
        if (
          destination.pathname === window.location.pathname &&
          destination.search === window.location.search
        ) {
          return;
        }

        setPending(true);
        fallbackTimer.current = setTimeout(() => setPending(false), 4000);
      }}
      {...props}
    >
      {pending ? <LoadingSpinner size={spinnerSize} label={pendingLabel} /> : children}
    </Link>
  );
}

export function ButtonLink({
  className,
  variant = "primary",
  size = "md",
  ...props
}: PendingLinkProps & {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md";
}) {
  return (
    <PendingLink
      className={["button", `button-${variant}`, `button-${size}`, className]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}

export function ActionLink({
  className,
  pendingLabel = "Opening…",
  ...props
}: PendingLinkProps) {
  return (
    <PendingLink
      pendingLabel={pendingLabel}
      spinnerSize={13}
      className={[
        "inline-flex items-center gap-1 text-xs font-semibold text-brand hover:text-brand-dark transition-colors aria-busy:opacity-70 aria-busy:cursor-wait",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}
