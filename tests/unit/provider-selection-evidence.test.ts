/** Provider selection requires affirmative backend evidence, not a plausible placeholder. */

import { describe, expect, it } from "vitest";
import { canSelectProviderCandidate } from "@/lib/domain";
import type { Candidate } from "@/types/domain";

const candidate: Candidate = {
  organizationId: "bank-1",
  organizationName: "Sample bank",
  bloodGroup: "O_NEGATIVE",
  offeredBloodGroup: "O_NEGATIVE",
  component: "RED_CELLS",
  unitsFree: 5,
  canFullyFulfil: true,
  rank: 1,
  matchType: "EXACT",
  coldChainVerified: true,
};

describe("provider selection evidence gate", () => {
  it("allows an eligible recorded match", () => {
    expect(canSelectProviderCandidate(candidate)).toBe(true);
  });

  it("rejects unavailable, failing, or unreported safety evidence", () => {
    expect(canSelectProviderCandidate({ ...candidate, canFullyFulfil: false })).toBe(false);
    expect(canSelectProviderCandidate({ ...candidate, coldChainVerified: false })).toBe(false);
    expect(canSelectProviderCandidate({ ...candidate, coldChainVerified: undefined })).toBe(false);
    expect(canSelectProviderCandidate({ ...candidate, matchType: undefined })).toBe(false);
  });
});
