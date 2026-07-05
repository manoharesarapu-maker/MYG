import { describe, expect, it } from "vitest";
import { ingestPolicyDocument } from "@/ingestion/ingestPolicyDocument";
import { isBuiltBranch } from "@/lib/taxonomy-types";

describe("ingestPolicyDocument", () => {
  it("loads all 10 fully-built parking permit branches", () => {
    const content = ingestPolicyDocument({ domain: "parking-permits" });
    expect(content.builtBranches).toHaveLength(10);
    expect(content.builtBranches.every(isBuiltBranch)).toBe(true);
  });

  it("includes the hardship/waiver branch as tier 0 with a non-null escalation", () => {
    const content = ingestPolicyDocument({ domain: "parking-permits" });
    const hardship = content.builtBranches.find((b) => b.id === "parking.hardship-waiver");
    expect(hardship).toBeDefined();
    expect(hardship?.tier).toBe(0);
    expect(hardship?.escalation).toBe("hardship_safeguarding");
  });

  it("loads platform-wide domain summaries totalling 281 parent interactions and 1404 decision branches", () => {
    const content = ingestPolicyDocument();
    expect(content.domains).toHaveLength(17);
    const totalParentInteractions = content.domains.reduce((sum, d) => sum + d.parent_interactions, 0);
    const totalDecisionBranches = content.domains.reduce((sum, d) => sum + d.decision_branches, 0);
    expect(totalParentInteractions).toBe(281);
    expect(totalDecisionBranches).toBe(1404);
  });

  it("loads stub branches for the remaining parking permit and other-domain scope", () => {
    const content = ingestPolicyDocument();
    expect(content.stubBranches.length).toBeGreaterThan(40);
  });
});
