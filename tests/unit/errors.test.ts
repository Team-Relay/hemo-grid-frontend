/** Locks down the stable Spring-error adapter used by pages and Server Actions. */

import { describe, expect, it } from "vitest";

import { toApiClientError } from "@/lib/api/errors";

describe("toApiClientError", () => {
  it("preserves the backend code, path, and field errors", () => {
    const error = toApiClientError(
      {
        status: 400,
        error: "Bad Request",
        code: "VALIDATION_FAILED",
        message: "Validation failed",
        path: "/api/v1/inventory/123",
        fieldErrors: [{ field: "unitsAvailable", message: "must be greater than or equal to 0" }],
      },
      500,
      "Fallback",
    );

    expect(error).toMatchObject({
      status: 400,
      code: "VALIDATION_FAILED",
      message: "Validation failed",
      path: "/api/v1/inventory/123",
      fieldErrors: [{ field: "unitsAvailable", message: "must be greater than or equal to 0" }],
    });
  });

  it("falls back safely when an upstream response is not the documented shape", () => {
    expect(toApiClientError("gateway error", 502, "API unavailable")).toMatchObject({
      status: 502,
      message: "API unavailable",
      fieldErrors: [],
    });
  });
});
