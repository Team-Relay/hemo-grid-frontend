/** Selects a ranked blood bank directly via the Spring Boot API. */

"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { z } from "zod";

import { revalidateHospitalRequestsAction } from "@/app/actions/blood-requests";
import { Button, FieldError, LoadingSpinner } from "@/components/ui/core";
import { selectBloodRequestProvider } from "@/lib/api/blood-requests";
import { ApiClientError } from "@/lib/api/errors";
import { clearClientSessionCookie, getClientAccessToken } from "@/lib/auth/client-session";
import {
  initialRequestMutationState,
  type RequestMutationActionState,
} from "@/lib/requests/action-state";
import { providerIdSchema, requestIdSchema } from "@/lib/validation/blood-request";

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
  const router = useRouter();
  const [state, setState] = useState<RequestMutationActionState>(initialRequestMutationState);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isPending) return;

    const validated = z
      .object({ requestId: requestIdSchema, providerId: providerIdSchema })
      .safeParse({
        requestId,
        providerId,
      });

    if (!validated.success) {
      setState({ message: "The selected request or provider is invalid. Refresh and try again." });
      return;
    }

    const accessToken = getClientAccessToken();
    if (!accessToken) {
      router.replace("/login?reason=session-expired");
      return;
    }

    setIsPending(true);
    setState(initialRequestMutationState);

    try {
      await selectBloodRequestProvider(
        accessToken,
        validated.data.requestId,
        validated.data.providerId,
      );
      await revalidateHospitalRequestsAction(validated.data.requestId);
      router.push(`/hospital/requests/${validated.data.requestId}`);
    } catch (error) {
      setIsPending(false);
      if (error instanceof ApiClientError) {
        if (error.status === 401) {
          clearClientSessionCookie();
          router.replace("/login?reason=session-expired");
          return;
        }
        if (error.status === 403) {
          setState({ message: "Your account cannot perform this hospital action." });
          return;
        }
        if (error.status === 404) {
          setState({ message: "This request or provider is no longer available." });
          return;
        }
        setState({ message: error.message });
        return;
      }

      setState({
        message: "HemoGrid could not reach the server. Check your connection and try again.",
      });
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={variant === "primary" ? "space-y-2" : "inline-grid gap-1"}
    >
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
          className="inline-flex items-center justify-end gap-1.5 border-0 bg-transparent text-xs font-semibold text-brand hover:text-brand-dark transition-colors disabled:cursor-wait disabled:opacity-60"
        >
          {isPending ? (
            <LoadingSpinner size={13} label="Selecting…" />
          ) : (
            <>
              Select <ArrowRight size={13} />
            </>
          )}
        </button>
      )}

      {state.message && <FieldError message={state.message} className="max-w-[260px]" />}
    </form>
  );
}
