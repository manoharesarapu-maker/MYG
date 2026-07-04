/**
 * Layer 5 — Extraction (semantic edge).
 *
 * Given a citizen's free-text answer, uses Claude to pull out the single
 * structured value the current requirement needs (e.g. pulling "123
 * Beach Road" out of "yeah it's 123 beach road, Bayside"). The extracted
 * value is then validated deterministically by
 * extraction-validation-rules.ts -- this module never decides whether a
 * value is acceptable, only what the citizen appears to have said.
 */

import { callClaudeForJson } from "@/lib/claude-client";
import type { Requirement } from "@/lib/taxonomy-types";

const SYSTEM_PROMPT = `You extract a single structured value from a citizen's free-text answer for a council parking permit request.

You will be given the requirement being asked about (its label and expected type) and the citizen's raw answer. Pull out just the value they gave for that requirement -- do not add information they didn't provide, and do not validate or judge whether it's acceptable.

Rules:
- If the citizen didn't actually answer the question (e.g. they asked something else instead), return null for the value.
- Never invent a value that isn't supported by their answer.
- Respond with JSON only, no prose, no code fences, in exactly this shape:
{"value": string | number | boolean | null}`;

export async function extractValue(requirement: Requirement, citizenAnswer: string): Promise<unknown> {
  const userMessage = `Requirement: ${requirement.label}\nExpected type: ${requirement.type}${
    requirement.options ? ` (one of: ${requirement.options.join(", ")})` : ""
  }\nCitizen's answer: """${citizenAnswer}"""`;

  const result = await callClaudeForJson<{ value: string | number | boolean | null }>(SYSTEM_PROMPT, userMessage);

  if (result && result.value !== null && result.value !== undefined) {
    return result.value;
  }

  if (result && result.value === null) {
    // Claude explicitly determined the citizen didn't answer the question.
    return null;
  }

  // Claude unavailable/unparseable: fall back to treating the raw answer
  // as the value directly. This works for the common case of a citizen
  // answering a single direct question plainly (e.g. "owner", "2", "yes").
  return citizenAnswer.trim();
}
