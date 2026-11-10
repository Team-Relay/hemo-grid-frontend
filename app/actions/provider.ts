/** Authenticated blood-bank request and inventory mutations exposed as Server Actions. */

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { updateInventoryUnits } from "@/lib/api/inventory";
import {
  acceptProviderRequest,
  declineProviderRequest,
  updateProviderRequestStatus,
} from "@/lib/api/provider-requests";
import { ApiClientError } from "@/lib/api/errors";
import { verifySession } from "@/lib/auth/dal";
import { deleteSession } from "@/lib/auth/session";
import type {
  InventoryActionState,
  ProviderActionState,
} from "@/lib/requests/provider-action-state";
import {
  inventoryUpdateSchema,
  providerRequestMutationSchema,
  type ProviderRequestIntent,
} from "@/lib/validation/provider";

export async function mutateProviderRequestAction(
  _previousState: ProviderActionState,
  formData: FormData,
): Promise<ProviderActionState> {
  const validated = providerRequestMutationSchema.safeParse({
    requestId: formData.get("requestId"),
    intent: formData.get("intent"),
  });
  if (!validated.success) {
    return { message: "The request action is invalid. Refresh the page and try again." };
  }

  const { accessToken } = await verifySession();
  try {
    const { requestId, intent } = validated.data;
    if (intent === "ACCEPT") await acceptProviderRequest(accessToken, requestId);
    else if (intent === "DECLINE") await declineProviderRequest(accessToken, requestId);
    else await updateProviderRequestStatus(accessToken, requestId, intent);

    revalidateProviderData(requestId);
    return {
      successMessage: providerSuccessMessage(intent),
      completedAt: Date.now(),
    };
  } catch (error) {
    return { ...(await handleProviderError(error)), completedAt: Date.now() };
  }
}

export async function updateInventoryAction(
  _previousState: InventoryActionState,
  formData: FormData,
): Promise<InventoryActionState> {
  const validated = inventoryUpdateSchema.safeParse({
    inventoryId: formData.get("inventoryId"),
    unitsAvailable: formData.get("unitsAvailable"),
  });
  if (!validated.success) {
    return {
      message: "Check the available-unit quantity and try again.",
      fieldErrors: z.flattenError(validated.error).fieldErrors,
    };
  }

  const { accessToken } = await verifySession();
  try {
    await updateInventoryUnits(
      accessToken,
      validated.data.inventoryId,
      validated.data.unitsAvailable,
    );
    revalidatePath("/blood-bank/inventory");
    revalidatePath("/blood-bank/dashboard");
    revalidatePath("/blood-bank/requests");
    return { successMessage: "Inventory updated successfully.", completedAt: Date.now() };
  } catch (error) {
    const state = await handleProviderError(error);
    return { ...state, fieldErrors: {}, completedAt: Date.now() };
  }
}

function revalidateProviderData(requestId: string): void {
  revalidatePath("/blood-bank/dashboard");
  revalidatePath("/blood-bank/requests");
  revalidatePath(`/blood-bank/requests/${requestId}`);
  revalidatePath("/blood-bank/inventory");
  revalidatePath("/hospital/dashboard");
  revalidatePath("/hospital/requests");
  revalidatePath(`/hospital/requests/${requestId}`);
}

async function handleProviderError(error: unknown): Promise<ProviderActionState> {
  if (!(error instanceof ApiClientError)) throw error;
  if (error.status === 401) {
    await deleteSession();
    redirect("/login?reason=session-expired");
  }
  if (error.status === 403)
    return { message: "Your account cannot perform this blood-bank action." };
  if (error.status === 404)
    return { message: "This request or inventory row is no longer available." };
  return { message: error.message };
}

function providerSuccessMessage(intent: ProviderRequestIntent): string {
  const messages: Record<ProviderRequestIntent, string> = {
    ACCEPT: "Request accepted and inventory reserved.",
    DECLINE: "Request declined. No inventory was reserved.",
    PREPARING: "Request marked as preparing.",
    IN_TRANSIT: "Request marked as in transit.",
    DELIVERED: "Delivery confirmed and reserved inventory consumed.",
  };
  return messages[intent];
}
