/**
 * Converts inconsistent transport failures into one predictable application
 * error. Components and Server Actions can therefore handle HTTP and network
 * failures without duplicating parsing logic.
 */

import { z } from "zod";

import type { ApiErrorCode, BackendFieldError } from "@/lib/api/backend-types";

const backendErrorSchema = z.object({
  status: z.number().int().optional(),
  error: z.string().optional(),
  code: z.string().optional(),
  message: z.string().optional(),
  path: z.string().optional(),
  fieldErrors: z
    .array(
      z.object({
        field: z.string(),
        message: z.string(),
      }),
    )
    .optional(),
});

export class ApiClientError extends Error {
  readonly status: number;
  readonly code?: ApiErrorCode | "NETWORK_ERROR" | "NETWORK_TIMEOUT";
  readonly path?: string;
  readonly fieldErrors: BackendFieldError[];

  constructor({
    message,
    status = 0,
    code,
    path,
    fieldErrors = [],
    cause,
  }: {
    message: string;
    status?: number;
    code?: ApiErrorCode | "NETWORK_ERROR" | "NETWORK_TIMEOUT";
    path?: string;
    fieldErrors?: BackendFieldError[];
    cause?: unknown;
  }) {
    super(message, cause === undefined ? undefined : { cause });
    this.name = "ApiClientError";
    this.status = status;
    this.code = code;
    this.path = path;
    this.fieldErrors = fieldErrors;
  }
}

/**
 * Parses a backend error body defensively. The optional fields keep the
 * frontend compatible while the backend migrates to its richer error envelope.
 */
export function toApiClientError(
  payload: unknown,
  fallbackStatus: number,
  fallbackMessage: string,
): ApiClientError {
  const parsed = backendErrorSchema.safeParse(payload);

  if (!parsed.success) {
    return new ApiClientError({
      status: fallbackStatus,
      message: fallbackMessage,
    });
  }

  const value = parsed.data;
  return new ApiClientError({
    status: value.status ?? fallbackStatus,
    code: value.code as ApiErrorCode | undefined,
    message: value.message || fallbackMessage,
    path: value.path,
    fieldErrors: value.fieldErrors ?? [],
  });
}
