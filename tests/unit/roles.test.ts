/** Ensures authentication redirects cannot drift away from role authorization rules. */

import { describe, expect, it } from "vitest";

import { workspacePathForRole } from "@/lib/auth/roles";

describe("workspacePathForRole", () => {
  it.each([
    ["HOSPITAL_ADMIN", "/hospital/dashboard"],
    ["HOSPITAL_STAFF", "/hospital/dashboard"],
    ["BLOOD_BANK_ADMIN", "/blood-bank/dashboard"],
    ["BLOOD_BANK_STAFF", "/blood-bank/dashboard"],
    ["PLATFORM_ADMIN", "/admin/dashboard"],
  ] as const)("maps %s to %s", (role, expectedPath) => {
    expect(workspacePathForRole(role)).toBe(expectedPath);
  });
});
