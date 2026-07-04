/**
 * Layer 3 — Classification (deterministic fallback).
 *
 * Plain keyword/substring matching against each built branch's
 * `parent_interaction` text and id. Used when Claude is unavailable,
 * errors, or returns an unparseable/empty result -- so classification
 * never simply fails, it degrades to something inspectable.
 */

import type { BuiltBranch } from "@/lib/taxonomy-types";
import type { ClassificationResult } from "@/classifiers/semantic-match";

const STOPWORDS = new Set([
  "a", "an", "the", "for", "to", "of", "my", "i", "want", "need", "please",
  "on", "in", "at", "and", "or", "is", "am", "can", "get", "have", "with",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 1 && !STOPWORDS.has(token));
}

export function rulesFallbackMatch(citizenText: string, builtBranches: BuiltBranch[]): ClassificationResult {
  const citizenTokens = new Set(tokenize(citizenText));

  const candidates = builtBranches
    .map((branch) => {
      const branchTokens = new Set(tokenize(`${branch.parent_interaction} ${branch.id.replace(/[._-]/g, " ")}`));
      const overlap = Array.from(branchTokens).filter((token) => citizenTokens.has(token)).length;
      // F1-style score (harmonic mean of overlap/citizenTokens and
      // overlap/branchTokens): rewards branches that share most of their
      // distinctive words with the citizen's message, without favouring
      // very short branch descriptions the way a plain min-ratio would.
      const totalSize = citizenTokens.size + branchTokens.size;
      const confidence = totalSize === 0 ? 0 : (2 * overlap) / totalSize;
      return { branchId: branch.id, confidence };
    })
    .filter((c) => c.confidence > 0)
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 3);

  return { candidates, matchedBy: "rules_fallback" };
}
