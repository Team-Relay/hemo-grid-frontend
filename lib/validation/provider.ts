/** Shared schemas for untrusted provider lifecycle and inventory form values. */

import { z } from "zod";

import { backendUuid } from "@/lib/validation/identifiers";

export const providerRequestIntentSchema = z.enum([
  "ACCEPT",
  "DECLINE",
  "PREPARING",
  "IN_TRANSIT",
  "DELIVERED",
]);

export const providerRequestMutationSchema = z.object({
  requestId: backendUuid("The request identifier is invalid."),
  intent: providerRequestIntentSchema,
});

export const inventoryUpdateSchema = z.object({
  inventoryId: backendUuid("The inventory identifier is invalid."),
  unitsAvailable: z.coerce
    .number("Enter a valid available-unit quantity.")
    .int("Available units must be a whole number.")
    .min(0, "Available units cannot be negative."),
});

export type ProviderRequestIntent = z.infer<typeof providerRequestIntentSchema>;
