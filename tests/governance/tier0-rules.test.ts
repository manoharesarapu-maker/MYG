import { describe, expect, it } from "vitest";
import { checkTier0, HARDSHIP_SAFEGUARDING_TRIGGERS } from "@/governance/tier0-rules";
import type { BuiltBranch, StubBranch } from "@/lib/taxonomy-types";

const standardBranch: BuiltBranch = {
  id: "parking.resident.standard-application",
  domain: "parking-permits",
  parent_interaction: "Apply for a resident parking permit",
  tier: 1,
  status: "built",
  requirements: [],
  decision_logic: [],
  outcomes: {},
  escalation: null,
};

const hardshipBranch: BuiltBranch = {
  id: "parking.hardship-waiver",
  domain: "parking-permits",
  parent_interaction: "Request a fee waiver or hardship consideration for a parking permit",
  tier: 0,
  status: "built",
  requirements: [],
  decision_logic: [],
  outcomes: {},
  escalation: "hardship_safeguarding",
};

const disabilityStub: StubBranch = {
  id: "parking.stub.disability-review",
  domain: "parking-permits",
  parent_interaction: "Review disability parking eligibility",
  tier: 0,
  status: "stub",
};

describe("checkTier0", () => {
  it("does not trigger for ordinary text against a standard branch", () => {
    const result = checkTier0({
      citizenText: "I'd like a resident parking permit for my street please.",
      matchedBranch: standardBranch,
    });
    expect(result.triggered).toBe(false);
    expect(result.reason).toBeNull();
  });

  it("triggers deterministically when the matched branch itself is tier 0", () => {
    const result = checkTier0({
      citizenText: "I need help with my permit fee.",
      matchedBranch: hardshipBranch,
    });
    expect(result.triggered).toBe(true);
    expect(result.source).toBe("branch_tier");
    expect(result.reason).toBe("hardship_safeguarding");
  });

  it("triggers for a tier 0 stub branch even without built decision logic", () => {
    const result = checkTier0({
      citizenText: "something unrelated",
      matchedBranch: disabilityStub,
    });
    expect(result.triggered).toBe(true);
    expect(result.source).toBe("branch_tier");
  });

  it("triggers on hardship language even when no branch has been matched yet", () => {
    const result = checkTier0({
      citizenText: "I'm really struggling financially and can't afford this permit fee.",
      matchedBranch: null,
    });
    expect(result.triggered).toBe(true);
    expect(result.source).toBe("keyword_match");
    expect(result.reason).toBe("hardship_safeguarding");
  });

  it("triggers on safeguarding language unrelated to money", () => {
    const result = checkTier0({
      citizenText: "I feel unsafe at home and don't know who else to tell.",
      matchedBranch: standardBranch,
    });
    expect(result.triggered).toBe(true);
    expect(result.source).toBe("keyword_match");
  });

  it("is case-insensitive", () => {
    const result = checkTier0({
      citizenText: "I AM FACING EVICTION and need to sort my permit out too.",
      matchedBranch: null,
    });
    expect(result.triggered).toBe(true);
  });

  it("every curated trigger phrase independently fires a match", () => {
    for (const phrase of HARDSHIP_SAFEGUARDING_TRIGGERS) {
      const result = checkTier0({
        citizenText: `Some context around ${phrase} in a sentence.`,
        matchedBranch: standardBranch,
      });
      expect(result.triggered).toBe(true);
    }
  });

  it("does not escalate a matched tier 1 branch just because it mentions payment", () => {
    const result = checkTier0({
      citizenText: "How much is the annual fee and when is it due?",
      matchedBranch: standardBranch,
    });
    expect(result.triggered).toBe(false);
  });
});
