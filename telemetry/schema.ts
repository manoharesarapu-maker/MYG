/**
 * Production-shaped telemetry schema for Guide.
 *
 * Every state transition in the conversation state machine emits one of
 * these events. In this demo, events are logged to the console and kept
 * in an in-memory array (see getTelemetryLog / clearTelemetryLog below).
 * In production this same schema would be shipped to a real analytics
 * pipeline -- only the transport changes.
 */

export type TelemetryEventType =
  | "session_start"
  | "intent_matched"
  | "intent_clarification_requested"
  | "question_asked"
  | "evidence_captured"
  | "evidence_rejected"
  | "decision_reached"
  | "handoff_complete"
  | "tier0_escalated"
  | "staff_review_required";

interface BaseTelemetryEvent {
  sessionId: string;
  timestamp: string; // ISO 8601
  type: TelemetryEventType;
}

export interface SessionStartEvent extends BaseTelemetryEvent {
  type: "session_start";
  channel: "web_chat" | "voice";
}

export interface IntentMatchedEvent extends BaseTelemetryEvent {
  type: "intent_matched";
  branchId: string;
  confidence: number;
  matchedBy: "semantic" | "rules_fallback";
}

export interface IntentClarificationRequestedEvent extends BaseTelemetryEvent {
  type: "intent_clarification_requested";
  candidateBranchIds: string[];
  reason: "low_confidence" | "no_match";
}

export interface QuestionAskedEvent extends BaseTelemetryEvent {
  type: "question_asked";
  branchId: string;
  requirementId: string;
}

export interface EvidenceCapturedEvent extends BaseTelemetryEvent {
  type: "evidence_captured";
  branchId: string;
  requirementId: string;
}

export interface EvidenceRejectedEvent extends BaseTelemetryEvent {
  type: "evidence_rejected";
  branchId: string;
  requirementId: string;
  reason: string;
}

export interface DecisionReachedEvent extends BaseTelemetryEvent {
  type: "decision_reached";
  branchId: string;
  outcome: string;
}

export interface HandoffCompleteEvent extends BaseTelemetryEvent {
  type: "handoff_complete";
  branchId: string;
  caseId: string;
}

export interface Tier0EscalatedEvent extends BaseTelemetryEvent {
  type: "tier0_escalated";
  branchId: string | null;
  escalationReason: string;
}

export interface StaffReviewRequiredEvent extends BaseTelemetryEvent {
  type: "staff_review_required";
  branchId: string;
  reason: string;
}

export type TelemetryEvent =
  | SessionStartEvent
  | IntentMatchedEvent
  | IntentClarificationRequestedEvent
  | QuestionAskedEvent
  | EvidenceCapturedEvent
  | EvidenceRejectedEvent
  | DecisionReachedEvent
  | HandoffCompleteEvent
  | Tier0EscalatedEvent
  | StaffReviewRequiredEvent;

const telemetryLog: TelemetryEvent[] = [];

export function emitTelemetry(event: TelemetryEvent): void {
  telemetryLog.push(event);
  // eslint-disable-next-line no-console
  console.log(`[telemetry] ${event.type}`, event);
}

export function getTelemetryLog(): readonly TelemetryEvent[] {
  return telemetryLog;
}

export function clearTelemetryLog(): void {
  telemetryLog.length = 0;
}

/**
 * Events with these types must never be counted as a "resolved" or
 * "commercial" interaction in any reporting/summary logic -- Tier 0 and
 * staff-review outcomes are handled by a human, not automated resolution.
 */
export const NON_COMMERCIAL_EVENT_TYPES: ReadonlySet<TelemetryEventType> = new Set([
  "tier0_escalated",
  "staff_review_required",
]);
