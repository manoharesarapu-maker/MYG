/**
 * Layer 3-6 orchestration: the deterministic conversation state machine.
 *
 * This is a hand-written, explicit state machine -- no agent framework.
 * Every transition emits a telemetry event (telemetry/schema.ts) so
 * behaviour is fully traceable. The state machine itself never calls an
 * LLM directly; it delegates to classifiers/ and the semantic agents/
 * modules, and treats their results as data.
 *
 * States: awaiting_intent -> clarifying -> collecting_requirement -> escalated | complete
 */

import { evaluateDecision } from "@/agents/decision-logic-rules";
import { extractValue } from "@/agents/extraction-semantic";
import { validateValue } from "@/agents/extraction-validation-rules";
import { generateQuestion, rephraseAfterInvalidAnswer } from "@/agents/question-generation-semantic";
import { selectNextRequirement } from "@/agents/question-selection-rules";
import { classifyIntent, hasConfidentMatch } from "@/classifiers/index";
import { buildCaseObject, type CaseObject } from "@/handoff/buildCaseObject";
import { checkTier0 } from "@/governance/tier0-rules";
import type { BuiltBranch } from "@/lib/taxonomy-types";
import { emitTelemetry } from "@/telemetry/schema";

export type ConversationState =
  | "awaiting_intent"
  | "clarifying"
  | "collecting_requirement"
  | "escalated"
  | "complete";

export interface ConversationSession {
  sessionId: string;
  state: ConversationState;
  matchedBranchId: string | null;
  clarificationCandidateIds: string[];
  capturedValues: Record<string, unknown>;
  currentRequirementId: string | null;
  escalation: { reason: string; source: string } | null;
  caseObject: CaseObject | null;
  createdAt: string;
}

export interface TurnResult {
  session: ConversationSession;
  guideMessage: string;
  serviceResolved?: { branchId: string; label: string };
  tier0Escalated?: boolean;
}

export function createSession(sessionId: string, channel: "web_chat" | "voice" = "web_chat"): ConversationSession {
  emitTelemetry({
    sessionId,
    timestamp: new Date().toISOString(),
    type: "session_start",
    channel,
  });

  return {
    sessionId,
    state: "awaiting_intent",
    matchedBranchId: null,
    clarificationCandidateIds: [],
    capturedValues: {},
    currentRequirementId: null,
    escalation: null,
    caseObject: null,
    createdAt: new Date().toISOString(),
  };
}

function findBranch(branches: BuiltBranch[], branchId: string | null): BuiltBranch | null {
  if (!branchId) return null;
  return branches.find((b) => b.id === branchId) ?? null;
}

function escalate(
  session: ConversationSession,
  reason: string,
  source: "branch_tier" | "keyword_match",
  message: string
): TurnResult {
  session.state = "escalated";
  session.escalation = { reason, source };

  emitTelemetry({
    sessionId: session.sessionId,
    timestamp: new Date().toISOString(),
    type: "tier0_escalated",
    branchId: session.matchedBranchId,
    escalationReason: reason,
  });

  return { session, guideMessage: message, tier0Escalated: true };
}

const HARDSHIP_ESCALATION_MESSAGE =
  "Thank you for letting us know. Requests involving financial hardship or safety concerns are handled personally by a council staff member rather than through automated processing — someone will be in touch with you directly to talk through options.";

async function askNextRequirementOrComplete(session: ConversationSession, branch: BuiltBranch): Promise<TurnResult> {
  const nextRequirement = selectNextRequirement(branch, session.capturedValues);

  if (nextRequirement) {
    session.currentRequirementId = nextRequirement.id;
    const question = await generateQuestion(branch, nextRequirement);

    emitTelemetry({
      sessionId: session.sessionId,
      timestamp: new Date().toISOString(),
      type: "question_asked",
      branchId: branch.id,
      requirementId: nextRequirement.id,
    });

    return { session, guideMessage: question };
  }

  // All requirements captured -- reach a decision and hand off.
  const decision = evaluateDecision(branch, session.capturedValues);

  emitTelemetry({
    sessionId: session.sessionId,
    timestamp: new Date().toISOString(),
    type: "decision_reached",
    branchId: branch.id,
    outcome: decision.outcomeKey,
  });

  const caseObject = buildCaseObject(branch, session.capturedValues, decision, session.sessionId);

  if (caseObject.requiresStaffReview) {
    emitTelemetry({
      sessionId: session.sessionId,
      timestamp: new Date().toISOString(),
      type: "staff_review_required",
      branchId: branch.id,
      reason: decision.outcomeKey,
    });
  }

  emitTelemetry({
    sessionId: session.sessionId,
    timestamp: new Date().toISOString(),
    type: "handoff_complete",
    branchId: branch.id,
    caseId: caseObject.caseId,
  });

  session.state = "complete";
  session.currentRequirementId = null;
  session.caseObject = caseObject;

  return { session, guideMessage: decision.message };
}

export async function handleTurn(
  session: ConversationSession,
  citizenText: string,
  builtBranches: BuiltBranch[]
): Promise<TurnResult> {
  if (session.state === "escalated") {
    return {
      session,
      guideMessage:
        "This request has already been passed to a council staff member. They'll be in touch directly -- there's nothing more to do here for now.",
    };
  }

  if (session.state === "complete") {
    return {
      session,
      guideMessage: "This request is already complete. Refresh to start a new request.",
    };
  }

  // Tier 0 governance runs on every turn, before anything else, regardless
  // of current state -- a hardship/safeguarding signal must hard-stop the
  // conversation even mid-flow on an otherwise ordinary branch.
  const currentBranch = findBranch(builtBranches, session.matchedBranchId);
  const keywordCheck = checkTier0({ citizenText, matchedBranch: currentBranch });
  if (keywordCheck.triggered) {
    return escalate(session, keywordCheck.reason ?? "hardship_safeguarding", keywordCheck.source ?? "keyword_match", HARDSHIP_ESCALATION_MESSAGE);
  }

  if (session.state === "awaiting_intent" || session.state === "clarifying") {
    const classification = await classifyIntent(citizenText, builtBranches);

    if (hasConfidentMatch(classification)) {
      const topBranchId = classification.candidates[0].branchId;
      const topBranch = findBranch(builtBranches, topBranchId);
      if (!topBranch) {
        // Defensive: classifier returned an id that isn't in our branch list.
        return { session, guideMessage: "Sorry, could you tell me a bit more about what you'd like help with?" };
      }

      const branchTierCheck = checkTier0({ citizenText, matchedBranch: topBranch });
      if (branchTierCheck.triggered) {
        session.matchedBranchId = topBranch.id;
        return escalate(
          session,
          branchTierCheck.reason ?? "hardship_safeguarding",
          branchTierCheck.source ?? "branch_tier",
          topBranch.status === "built" ? topBranch.outcomes.escalated_to_human?.message_template ?? HARDSHIP_ESCALATION_MESSAGE : HARDSHIP_ESCALATION_MESSAGE
        );
      }

      session.matchedBranchId = topBranch.id;
      session.state = "collecting_requirement";
      session.clarificationCandidateIds = [];

      emitTelemetry({
        sessionId: session.sessionId,
        timestamp: new Date().toISOString(),
        type: "intent_matched",
        branchId: topBranch.id,
        confidence: classification.candidates[0].confidence,
        matchedBy: classification.matchedBy,
      });

      const result = await askNextRequirementOrComplete(session, topBranch);
      return { ...result, serviceResolved: { branchId: topBranch.id, label: topBranch.parent_interaction } };
    }

    // No confident match -- ask a clarifying question rather than guessing.
    session.state = "clarifying";
    session.clarificationCandidateIds = classification.candidates.map((c) => c.branchId);

    emitTelemetry({
      sessionId: session.sessionId,
      timestamp: new Date().toISOString(),
      type: "intent_clarification_requested",
      candidateBranchIds: session.clarificationCandidateIds,
      reason: classification.candidates.length > 0 ? "low_confidence" : "no_match",
    });

    const guideMessage = buildClarifyingMessage(classification.candidates.map((c) => findBranch(builtBranches, c.branchId)));
    return { session, guideMessage };
  }

  // state === "collecting_requirement"
  const branch = findBranch(builtBranches, session.matchedBranchId);
  if (!branch) {
    // Defensive: session references a branch id we can't find. Reset to intent gathering.
    session.state = "awaiting_intent";
    session.matchedBranchId = null;
    return { session, guideMessage: "Sorry, something went wrong on our end. Could you tell me again what you need help with?" };
  }

  if (session.currentRequirementId) {
    const requirement = branch.requirements.find((r) => r.id === session.currentRequirementId);
    if (!requirement) {
      session.currentRequirementId = null;
      return askNextRequirementOrComplete(session, branch);
    }

    const rawValue = await extractValue(requirement, citizenText);

    if (rawValue === null) {
      emitTelemetry({
        sessionId: session.sessionId,
        timestamp: new Date().toISOString(),
        type: "evidence_rejected",
        branchId: branch.id,
        requirementId: requirement.id,
        reason: "no_answer_extracted",
      });
      return { session, guideMessage: rephraseAfterInvalidAnswer(requirement, "we couldn't quite understand that answer") };
    }

    const validation = validateValue(requirement, rawValue);

    if (!validation.valid) {
      emitTelemetry({
        sessionId: session.sessionId,
        timestamp: new Date().toISOString(),
        type: "evidence_rejected",
        branchId: branch.id,
        requirementId: requirement.id,
        reason: validation.reason ?? "invalid_value",
      });
      return { session, guideMessage: rephraseAfterInvalidAnswer(requirement, validation.reason ?? "that didn't look right") };
    }

    session.capturedValues[requirement.id] = validation.value;
    session.currentRequirementId = null;

    emitTelemetry({
      sessionId: session.sessionId,
      timestamp: new Date().toISOString(),
      type: "evidence_captured",
      branchId: branch.id,
      requirementId: requirement.id,
    });
  }

  return askNextRequirementOrComplete(session, branch);
}

function buildClarifyingMessage(candidates: (BuiltBranch | null)[]): string {
  const labels = candidates.filter((b): b is BuiltBranch => b !== null).map((b) => b.parent_interaction);

  if (labels.length === 0) {
    return "Could you tell me a bit more about what you'd like help with today? For example, applying for or renewing a parking permit.";
  }

  if (labels.length === 1) {
    return `Just to confirm, do you mean: "${labels[0]}"?`;
  }

  return `Just to narrow this down, did you mean one of these?\n${labels.map((l) => `- ${l}`).join("\n")}`;
}
