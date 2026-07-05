/**
 * Layer 6 — Handoff.
 *
 * Once every requirement for a branch is captured and a decision has
 * been reached, produces a structured, complete case object -- the same
 * shape that would be handed to Validator in production. In this demo it
 * is rendered as a summary screen, not sent anywhere.
 */

import type { DecisionResult } from "@/agents/decision-logic-rules";
import type { BuiltBranch } from "@/lib/taxonomy-types";

export interface CaseObject {
  caseId: string;
  sessionId: string;
  branchId: string;
  domain: string;
  parentInteraction: string;
  submittedAt: string;
  requirementAnswers: Array<{
    requirementId: string;
    label: string;
    value: unknown;
  }>;
  outcome: {
    key: string;
    message: string;
  };
  requiresStaffReview: boolean;
}

const STAFF_REVIEW_OUTCOME_KEYS = new Set(["staff_review_required", "extended_review_required"]);

export function buildCaseObject(
  branch: BuiltBranch,
  capturedValues: Record<string, unknown>,
  decision: DecisionResult,
  sessionId: string
): CaseObject {
  const requirementAnswers = branch.requirements
    .filter((requirement) => capturedValues[requirement.id] !== undefined)
    .map((requirement) => ({
      requirementId: requirement.id,
      label: requirement.label,
      value: capturedValues[requirement.id],
    }));

  return {
    caseId: `case_${branch.id.replace(/\./g, "-")}_${Date.now().toString(36)}`,
    sessionId,
    branchId: branch.id,
    domain: branch.domain,
    parentInteraction: branch.parent_interaction,
    submittedAt: new Date().toISOString(),
    requirementAnswers,
    outcome: { key: decision.outcomeKey, message: decision.message },
    requiresStaffReview: STAFF_REVIEW_OUTCOME_KEYS.has(decision.outcomeKey),
  };
}
