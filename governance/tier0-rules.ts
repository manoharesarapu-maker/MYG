/**
 * Tier 0 (welfare / hardship / safeguarding) detection and escalation.
 *
 * This module must never call an LLM. Detection is deterministic: a
 * curated keyword list, plus explicit `tier: 0` tags on taxonomy branches.
 * A positive result must short-circuit the conversation state machine to
 * `escalated` before any question generation or extraction runs, and must
 * never be counted as a "resolved" or "commercial" interaction.
 */

import type { TaxonomyBranch } from "@/lib/taxonomy-types";

/**
 * Curated, hand-maintained trigger phrases. Matched as case-insensitive
 * substrings against citizen free text. Keep this list narrow and
 * deliberate -- it is a safeguarding control, not a spam filter.
 */
export const HARDSHIP_SAFEGUARDING_TRIGGERS: readonly string[] = [
  "hardship",
  "can't afford",
  "cannot afford",
  "can't pay",
  "cannot pay",
  "financial difficulty",
  "financial hardship",
  "struggling financially",
  "struggling to pay",
  "domestic violence",
  "family violence",
  "in danger",
  "unsafe at home",
  "being abused",
  "abuse",
  "suicide",
  "self harm",
  "self-harm",
  "homeless",
  "facing eviction",
  "losing my home",
  "at risk",
  "vulnerable",
  "in crisis",
  "safety concern",
];

export interface Tier0CheckInput {
  /** The citizen's latest free-text message. */
  citizenText: string;
  /** The taxonomy branch currently matched, if any. */
  matchedBranch?: TaxonomyBranch | null;
}

export interface Tier0CheckResult {
  triggered: boolean;
  /** Why this was escalated. Null when not triggered. */
  reason: string | null;
  /** What caused the trigger: the branch's own tier, or detected language. */
  source: "branch_tier" | "keyword_match" | null;
  matchedKeyword?: string;
}

function findMatchedKeyword(text: string): string | null {
  const normalized = text.toLowerCase();
  for (const trigger of HARDSHIP_SAFEGUARDING_TRIGGERS) {
    if (normalized.includes(trigger)) {
      return trigger;
    }
  }
  return null;
}

/**
 * Runs on every citizen turn, regardless of current conversation state.
 * A branch tagged `tier: 0` always escalates, even if no trigger phrase
 * is present in this specific message -- the branch itself is the
 * safeguarding signal (e.g. the hardship/waiver branch).
 */
export function checkTier0(input: Tier0CheckInput): Tier0CheckResult {
  const { citizenText, matchedBranch } = input;

  if (matchedBranch && matchedBranch.tier === 0) {
    return {
      triggered: true,
      reason: matchedBranch.status === "built" ? matchedBranch.escalation ?? "tier0_branch" : "tier0_branch",
      source: "branch_tier",
    };
  }

  const matchedKeyword = findMatchedKeyword(citizenText);
  if (matchedKeyword) {
    return {
      triggered: true,
      reason: "hardship_safeguarding",
      source: "keyword_match",
      matchedKeyword,
    };
  }

  return { triggered: false, reason: null, source: null };
}
