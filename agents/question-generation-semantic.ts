/**
 * Layer 4 — Question generation (semantic edge).
 *
 * Given the requirement that question-selection-rules.ts has already
 * decided to ask about, uses Claude only to phrase it naturally. Claude
 * never chooses which requirement to ask about, and is explicitly told
 * not to invent policy details beyond the supplied label.
 */

import { callClaudeForJson } from "@/lib/claude-client";
import type { BuiltBranch, Requirement } from "@/lib/taxonomy-types";

const SYSTEM_PROMPT = `You are Guide, a plain-English assistant helping a citizen of City of Bayside Harbour council complete a parking permit request.

You will be given the name of the service they're applying for and a single piece of information you need to collect next. Phrase ONE short, friendly, plain-English question that asks for exactly that piece of information -- nothing more.

Rules:
- Only ask for the information described. Do not ask for anything else, and do not mention fees, eligibility, or policy details not given to you.
- Do not invent requirements, deadlines, or amounts.
- Keep it to one sentence if possible.
- Respond with JSON only, no prose, no code fences, in exactly this shape:
{"question": string}`;

function fallbackPhrasing(requirement: Requirement): string {
  const label = requirement.label.trim();
  const alreadyPhrasedAsQuestion = label.endsWith("?");

  if (requirement.type === "enum" && requirement.options) {
    const base = alreadyPhrasedAsQuestion ? label : `${label}?`;
    return `${base} (${requirement.options.join(" or ")})`;
  }

  if (alreadyPhrasedAsQuestion) {
    return label;
  }

  return `Could you tell me: ${label.charAt(0).toLowerCase()}${label.slice(1)}?`;
}

export async function generateQuestion(branch: BuiltBranch, requirement: Requirement): Promise<string> {
  const userMessage = `Service: ${branch.parent_interaction}\nInformation needed next: ${requirement.label}${
    requirement.options ? ` (options: ${requirement.options.join(", ")})` : ""
  }`;

  const result = await callClaudeForJson<{ question: string }>(SYSTEM_PROMPT, userMessage);

  if (result && typeof result.question === "string" && result.question.trim().length > 0) {
    return result.question.trim();
  }

  return fallbackPhrasing(requirement);
}

/**
 * Phrasing used when a previous answer failed validation and the same
 * requirement needs to be re-asked. Kept deterministic (no LLM call) so
 * re-asks are fast and always land on the same clear wording.
 */
export function rephraseAfterInvalidAnswer(requirement: Requirement, reason: string): string {
  return `Sorry, that didn't look right (${reason}). ${fallbackPhrasing(requirement)}`;
}
