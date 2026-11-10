/** Shared validation for the hospital request form. */

import { z } from "zod";

const optionalText = (maximum: number, message: string) =>
  z
    .string()
    .trim()
    .max(maximum, message)
    .transform((value) => value || undefined);

export const createBloodRequestSchema = z.object({
  bloodGroup: z.enum(
    [
      "A_POSITIVE",
      "A_NEGATIVE",
      "B_POSITIVE",
      "B_NEGATIVE",
      "AB_POSITIVE",
      "AB_NEGATIVE",
      "O_POSITIVE",
      "O_NEGATIVE",
    ],
    { error: "Select a valid blood group." },
  ),
  component: z.enum(["WHOLE_BLOOD", "RED_CELLS", "PLATELETS", "PLASMA"], {
    error: "Select a valid blood component.",
  }),
  unitsRequired: z.coerce
    .number({ error: "Enter the number of units required." })
    .int("Units must be a whole number.")
    .min(1, "Request at least one unit.")
    .max(20, "A single request cannot exceed 20 units."),
  urgency: z.enum(["ROUTINE", "URGENT", "CRITICAL"], {
    error: "Select a valid urgency.",
  }),
  clinicalReference: optionalText(120, "Clinical reference cannot exceed 120 characters."),
  notes: optionalText(2_000, "Notes cannot exceed 2,000 characters."),
});

export const requestIdSchema = z.uuid("The request identifier is invalid.");
export const providerIdSchema = z.uuid("The provider identifier is invalid.");

export type CreateBloodRequestInput = z.infer<typeof createBloodRequestSchema>;
