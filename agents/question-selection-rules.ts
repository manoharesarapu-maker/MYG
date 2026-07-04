/**
 * Layer 4 — Question generation (deterministic half).
 *
 * Decides WHAT to ask next, driven entirely by the matched branch's
 * requirement list and what's already been captured. Never calls an LLM.
 * The phrasing of the question is a separate concern -- see
 * question-generation-semantic.ts.
 */

import type { BuiltBranch, Requirement } from "@/lib/taxonomy-types";

export function selectNextRequirement(
  branch: BuiltBranch,
  capturedValues: Record<string, unknown>
): Requirement | null {
  for (const requirement of branch.requirements) {
    if (!requirement.required) continue;
    const value = capturedValues[requirement.id];
    if (value === undefined || value === null || value === "") {
      return requirement;
    }
  }
  return null;
}

export function isBranchComplete(branch: BuiltBranch, capturedValues: Record<string, unknown>): boolean {
  return selectNextRequirement(branch, capturedValues) === null;
}
