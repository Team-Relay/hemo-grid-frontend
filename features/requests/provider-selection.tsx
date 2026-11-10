/** Renders ranked real candidates and prevents selection when one bank cannot fulfil all units. */

"use client";

import { useActionState } from "react";
import { ArrowRight, LoaderCircle } from "lucide-react";

import { selectProviderAction } from "@/app/actions/blood-requests";
import { Button } from "@/components/ui/core";
import { initialRequestMutationState } from "@/lib/requests/action-state";

export function ProviderSelection({
  requestId,
  providerId,
  units,
  variant = "inline",
}: {
  requestId: string;
  providerId: string;
  units: number;
  variant?: "primary" | "inline";
}) {
  const [state, formAction, isPending] = useActionState(
    selectProviderAction,
    initialRequestMutationState,
  );

  return (
    <form action={formAction} className={variant === "primary" ? "space-y-2" : "inline-grid gap-1"}>
      <input type="hidden" name="requestId" value={requestId} />
      <input type="hidden" name="providerId" value={providerId} />

      {variant === "primary" ? (
        <Button
          type="submit"
          isLoading={isPending}
          loadingText="Selecting provider…"
          className="w-full h-11 text-xs font-semibold rounded-xl shadow-sm"
        >
          Request {units} units from this facility <ArrowRight size={15} />
        </Button>
      ) : (
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center justify-end gap-1 border-0 bg-transparent text-xs font-semibold text-brand hover:text-brand-dark transition-colors disabled:cursor-wait disabled:opacity-60"
        >
          {isPending ? (
            <>
              <LoaderCircle size={13} className="animate-[spin_700ms_linear_infinite]" /> Selecting…
            </>
          ) : (
            <>
              Select <ArrowRight size={13} />
            </>
          )}
        </button>
      )}

      {state.message && (
        <p className="m-0 max-w-[260px] text-[10px] leading-4 text-critical" role="alert">
          {state.message}
        </p>
      )}
    </form>
  );
}
