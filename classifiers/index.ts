/**
 * Layer 3 — Classification entry point.
 *
 * Tries the Claude-backed semantic matcher first; falls back to the
 * deterministic keyword matcher when Claude is unavailable, errors, or
 * returns no usable candidates. Callers (the conversation state machine)
 * must treat anything below CONFIDENCE_THRESHOLD as "no confident
 * match" and ask a clarifying question rather than guessing.
 */

import { rulesFallbackMatch } from "@/classifiers/rules-fallback";
import { semanticMatch, type ClassificationResult } from "@/classifiers/semantic-match";
import type { BuiltBranch } from "@/lib/taxonomy-types";

export const CONFIDENCE_THRESHOLD = 0.55;

export type { ClassificationCandidate, ClassificationResult } from "@/classifiers/semantic-match";

export async function classifyIntent(
  citizenText: string,
  builtBranches: BuiltBranch[]
): Promise<ClassificationResult> {
  const semanticResult = await semanticMatch(citizenText, builtBranches);

  if (semanticResult && semanticResult.candidates.length > 0) {
    return semanticResult;
  }

  return rulesFallbackMatch(citizenText, builtBranches);
}

export function hasConfidentMatch(result: ClassificationResult): boolean {
  return result.candidates.length > 0 && result.candidates[0].confidence >= CONFIDENCE_THRESHOLD;
}
