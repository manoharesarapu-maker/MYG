/**
 * Layer 3 — Classification (semantic edge).
 *
 * Calls Claude to compare citizen free text against the set of built
 * taxonomy branches and returns candidate matches with a confidence
 * score. Claude only ever picks among the branch ids it's given here --
 * it never invents a branch, and it never decides eligibility.
 */

import { callClaudeForJson } from "@/lib/claude-client";
import type { BuiltBranch } from "@/lib/taxonomy-types";

export interface ClassificationCandidate {
  branchId: string;
  confidence: number; // 0..1
}

export interface ClassificationResult {
  candidates: ClassificationCandidate[];
  matchedBy: "semantic" | "rules_fallback";
}

const SYSTEM_PROMPT = `You are the intent classifier for Guide, a citizen intake assistant for City of Bayside Harbour council.

You will be given a citizen's free-text message and a list of taxonomy branches, each with an id and a short description of the interaction it represents.

Your only job is to decide which of the SUPPLIED branches (if any) the citizen's message most plausibly matches, and how confident you are.

Rules:
- Only use the branch ids provided to you. Never invent a branch id that isn't in the supplied list.
- Do not decide eligibility, outcomes, fees, or policy details. That is not your job.
- If nothing in the list plausibly matches, return an empty candidates array rather than guessing.
- Respond with JSON only, no prose, no markdown code fences, matching exactly this shape:
{"candidates": [{"branchId": string, "confidence": number between 0 and 1}]}
- Return at most 3 candidates, sorted by confidence descending.`;

function buildUserMessage(citizenText: string, builtBranches: BuiltBranch[]): string {
  const branchList = builtBranches
    .map((b) => `- id: ${b.id}\n  interaction: ${b.parent_interaction}`)
    .join("\n");

  return `Available branches:\n${branchList}\n\nCitizen message:\n"""${citizenText}"""`;
}

export async function semanticMatch(
  citizenText: string,
  builtBranches: BuiltBranch[]
): Promise<ClassificationResult | null> {
  const result = await callClaudeForJson<{ candidates: ClassificationCandidate[] }>(
    SYSTEM_PROMPT,
    buildUserMessage(citizenText, builtBranches)
  );

  if (!result || !Array.isArray(result.candidates)) {
    return null;
  }

  const validBranchIds = new Set(builtBranches.map((b) => b.id));
  const candidates = result.candidates
    .filter((c) => validBranchIds.has(c.branchId) && typeof c.confidence === "number")
    .map((c) => ({ branchId: c.branchId, confidence: Math.max(0, Math.min(1, c.confidence)) }))
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 3);

  return { candidates, matchedBy: "semantic" };
}
