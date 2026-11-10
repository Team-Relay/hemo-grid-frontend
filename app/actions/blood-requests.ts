/** Hospital blood-request mutations exposed as Next.js Server Actions. */

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import {
  cancelBloodRequest,
  createBloodRequest,
  selectBloodRequestProvider,
} from "@/lib/api/blood-requests";
import { ApiClientError } from "@/lib/api/errors";
import { verifySession } from "@/lib/auth/dal";
import { deleteSession } from "@/lib/auth/session";
import type {
  RequestFormActionState,
  RequestMutationActionState,
} from "@/lib/requests/action-state";
import {
  createBloodRequestSchema,
  providerIdSchema,
  requestIdSchema,
} from "@/lib/validation/blood-request";

export async function createBloodRequestAction(
  _previousState: RequestFormActionState,
  formData: FormData,
): Promise<RequestFormActionState> {
  const validated = createBloodRequestSchema.safeParse({
    bloodGroup: formData.get("bloodGroup"),
    component: formData.get("component"),
    unitsRequired: formData.get("unitsRequired"),
    urgency: formData.get("urgency"),
    clinicalReference: formData.get("clinicalReference"),
    notes: formData.get("notes"),
  });

  if (!validated.success) {
    const fields = z.flattenError(validated.error).fieldErrors;
    return {
      message: "Check the highlighted request details and try again.",
      fieldErrors: fields,
    };
  }

  const { accessToken } = await verifySession();
  let created;
  try {
    created = await createBloodRequest(accessToken, validated.data);
  } catch (error) {
    return handleRequestFormError(error);
  }

  revalidateHospitalRequests(created.id);
  redirect(`/hospital/requests/${created.id}/matches`);
}

export async function selectProviderAction(
  _previousState: RequestMutationActionState,
  formData: FormData,
): Promise<RequestMutationActionState> {
  const validated = z
    .object({ requestId: requestIdSchema, providerId: providerIdSchema })
    .safeParse({
      requestId: formData.get("requestId"),
      providerId: formData.get("providerId"),
    });

  if (!validated.success) {
    return { message: "The selected request or provider is invalid. Refresh and try again." };
  }

  const { accessToken } = await verifySession();
  try {
    await selectBloodRequestProvider(
      accessToken,
      validated.data.requestId,
      validated.data.providerId,
    );
  } catch (error) {
    return handleMutationError(error);
  }

  revalidateHospitalRequests(validated.data.requestId);
  redirect(`/hospital/requests/${validated.data.requestId}`);
}

export async function cancelRequestAction(
  _previousState: RequestMutationActionState,
  formData: FormData,
): Promise<RequestMutationActionState> {
  const validated = requestIdSchema.safeParse(formData.get("requestId"));
  if (!validated.success) {
    return { message: "The request identifier is invalid. Refresh and try again." };
  }

  const { accessToken } = await verifySession();
  try {
    await cancelBloodRequest(accessToken, validated.data);
  } catch (error) {
    return handleMutationError(error);
  }

  revalidateHospitalRequests(validated.data);
  redirect(`/hospital/requests/${validated.data}`);
}

function revalidateHospitalRequests(requestId: string): void {
  revalidatePath("/hospital/dashboard");
  revalidatePath("/hospital/requests");
  revalidatePath(`/hospital/requests/${requestId}`);
  revalidatePath(`/hospital/requests/${requestId}/matches`);
}

async function handleRequestFormError(error: unknown): Promise<RequestFormActionState> {
  if (!(error instanceof ApiClientError)) throw error;
  await redirectExpiredSession(error);

  const fieldErrors: NonNullable<RequestFormActionState["fieldErrors"]> = {};
  for (const fieldError of error.fieldErrors) {
    if (isRequestField(fieldError.field)) {
      fieldErrors[fieldError.field] = [
        ...(fieldErrors[fieldError.field] ?? []),
        fieldError.message,
      ];
    }
  }

  return { message: requestErrorMessage(error), fieldErrors };
}

async function handleMutationError(error: unknown): Promise<RequestMutationActionState> {
  if (!(error instanceof ApiClientError)) throw error;
  await redirectExpiredSession(error);
  return { message: requestErrorMessage(error) };
}

async function redirectExpiredSession(error: ApiClientError): Promise<void> {
  if (error.status === 401) {
    await deleteSession();
    redirect("/login?reason=session-expired");
  }
}

function requestErrorMessage(error: ApiClientError): string {
  if (error.status === 403) return "Your account cannot perform this hospital action.";
  if (error.status === 404) return "This request or provider is no longer available.";
  if (error.status === 409) return error.message;
  return error.message;
}

function isRequestField(
  field: string,
): field is keyof NonNullable<RequestFormActionState["fieldErrors"]> {
  return [
    "bloodGroup",
    "component",
    "unitsRequired",
    "urgency",
    "clinicalReference",
    "notes",
  ].includes(field);
}
