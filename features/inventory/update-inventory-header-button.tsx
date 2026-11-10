"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Boxes, Check } from "lucide-react";
import { revalidateProviderDataAction } from "@/app/actions/provider";
import { LoadingSpinner, cn } from "@/components/ui/core";

export function UpdateInventoryHeaderButton({ className }: { className?: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [justRefreshed, setJustRefreshed] = useState(false);

  function handleUpdate() {
    startTransition(async () => {
      try {
        await revalidateProviderDataAction();
        router.refresh();
      } finally {
        const el = document.getElementById("inventory-table");
        if (el) {
          el.scrollIntoView({ behavior: "smooth" });
        }
        setJustRefreshed(true);
        setTimeout(() => setJustRefreshed(false), 2200);
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleUpdate}
      disabled={isPending}
      aria-busy={isPending || undefined}
      className={cn(
        "h-10 inline-flex items-center gap-2 px-[18px] rounded-full text-[#fff] bg-brand text-[12.5px] font-[650] shadow-[0_2px_8px_rgba(67,56,202,0.18)] transition-all duration-180 ease-in-out whitespace-nowrap hover:bg-brand-dark hover:-translate-y-[1px] disabled:cursor-wait disabled:opacity-85",
        className
      )}
    >
      {isPending ? (
        <LoadingSpinner size={15} label="Updating inventory…" />
      ) : justRefreshed ? (
        <>
          <Check size={15} strokeWidth={2.2} className="text-emerald-300" />
          <span>Inventory updated</span>
        </>
      ) : (
        <>
          <Boxes size={15} strokeWidth={1.8} />
          <span>Update inventory</span>
        </>
      )}
    </button>
  );
}
