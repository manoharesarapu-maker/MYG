import { describe, expect, it } from "vitest";
import { rulesFallbackMatch } from "@/classifiers/rules-fallback";
import { hasConfidentMatch, CONFIDENCE_THRESHOLD } from "@/classifiers/index";
import { ingestPolicyDocument } from "@/ingestion/ingestPolicyDocument";

describe("rulesFallbackMatch", () => {
  const { builtBranches } = ingestPolicyDocument({ domain: "parking-permits" });

  it("matches a new resident permit request to the resident standard-application branch, not renewal", () => {
    const result = rulesFallbackMatch(
      "I just moved in and want to apply for a new resident parking permit for my car",
      builtBranches
    );
    expect(result.matchedBy).toBe("rules_fallback");
    expect(result.candidates[0]?.branchId).toBe("parking.resident.standard-application");
  });

  it("matches a visitor permit request to the visitor branch", () => {
    const result = rulesFallbackMatch("Can I get a visitor parking permit for my mother's car", builtBranches);
    expect(result.candidates[0]?.branchId).toBe("parking.visitor");
  });

  it("returns no candidates for unrelated text", () => {
    const result = rulesFallbackMatch("what time does the library open", builtBranches);
    expect(result.candidates).toHaveLength(0);
  });

  it("hasConfidentMatch is false for an empty candidate list", () => {
    expect(hasConfidentMatch({ candidates: [], matchedBy: "rules_fallback" })).toBe(false);
  });

  it("hasConfidentMatch respects the confidence threshold", () => {
    expect(
      hasConfidentMatch({
        candidates: [{ branchId: "parking.visitor", confidence: CONFIDENCE_THRESHOLD - 0.01 }],
        matchedBy: "rules_fallback",
      })
    ).toBe(false);
    expect(
      hasConfidentMatch({
        candidates: [{ branchId: "parking.visitor", confidence: CONFIDENCE_THRESHOLD }],
        matchedBy: "rules_fallback",
      })
    ).toBe(true);
  });
});
