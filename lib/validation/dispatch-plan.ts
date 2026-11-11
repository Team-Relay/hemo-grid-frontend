/** Validation schema for PLATFORM_ADMIN joint dispatch plan previews. */

import { z } from "zod";
import { backendUuid } from "@/lib/validation/identifiers";

export const createDispatchPlanSchema = z.object({
  requestIds: z
    .array(backendUuid("Each selected request must be a valid request identifier."))
    .min(2, "Select at least 2 pending critical red-cell requests.")
    .max(5, "Select at most 5 requests in a single dispatch batch.")
    .refine((ids) => new Set(ids).size === ids.length, {
      message: "Each request can only be included once in a batch.",
    }),
  staffApproved: z.literal(true, {
    message: "Staff must confirm approval before running the batch preview.",
  }),
});

export type CreateDispatchPlanInput = z.infer<typeof createDispatchPlanSchema>;
