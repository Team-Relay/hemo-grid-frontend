"use client";

import { LoaderCircle } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type PendingLinkProps = Omit<React.ComponentProps<typeof Link>, "href"> & {
  href: string;
  pendingLabel?: string;
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
      {pending ? (
        <>
          <LoaderCircle className="button-spinner" size={15} strokeWidth={1.9} />
          <span>{pendingLabel}</span>
        </>
      ) : (
        children
      )}
    </Link>
  );
}

export function ButtonLink({
  className,
  variant = "primary",
  ...props
}: PendingLinkProps & {
  variant?: "primary" | "secondary" | "danger" | "ghost";
}) {
  return (
    <PendingLink
      className={["button", `button-${variant}`, "button-md", className].filter(Boolean).join(" ")}
      {...props}
    />
  );
}
