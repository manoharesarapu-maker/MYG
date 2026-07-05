/**
 * Guide orchestrator service. Lambda-shaped even though this demo runs on
 * Vercel: one handler, ties one conversational turn together.
 *
 * classifiers -> governance -> agents -> handoff, all via
 * agents/conversation-state-machine.ts. This handler owns session
 * lookup/storage only -- it contains no business logic of its own.
 */

import { createSession, handleTurn, type ConversationState } from "@/agents/conversation-state-machine";
import type { CaseObject } from "@/handoff/buildCaseObject";
import { ingestPolicyDocument } from "@/ingestion/ingestPolicyDocument";
import type { BuiltBranch } from "@/lib/taxonomy-types";

export interface GuideRequestEvent {
  sessionId: string;
  message: string;
  channel?: "web_chat" | "voice";
}

export interface GuideResponseEvent {
  sessionId: string;
  guideMessage: string;
  state: ConversationState;
  serviceResolved?: { branchId: string; label: string };
  tier0Escalated?: boolean;
  caseObject: CaseObject | null;
}

/**
 * In-memory session store, keyed by session id. Demo-only -- see
 * DECISIONS.md for why this would become a real session store (e.g.
 * Postgres or Redis-backed) in production.
 */
const sessions = new Map<string, ReturnType<typeof createSession>>();

let cachedBuiltBranches: BuiltBranch[] | null = null;

function getBuiltBranches(): BuiltBranch[] {
  if (!cachedBuiltBranches) {
    cachedBuiltBranches = ingestPolicyDocument({ domain: "parking-permits" }).builtBranches;
  }
  return cachedBuiltBranches;
}

export async function handler(event: GuideRequestEvent): Promise<GuideResponseEvent> {
  let session = sessions.get(event.sessionId);
  if (!session) {
    session = createSession(event.sessionId, event.channel ?? "web_chat");
  }

  const result = await handleTurn(session, event.message, getBuiltBranches());
  sessions.set(event.sessionId, result.session);

  return {
    sessionId: event.sessionId,
    guideMessage: result.guideMessage,
    state: result.session.state,
    serviceResolved: result.serviceResolved,
    tier0Escalated: result.tier0Escalated,
    caseObject: result.session.caseObject,
  };
}

export function resetSession(sessionId: string): void {
  sessions.delete(sessionId);
}
