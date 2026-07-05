import { beforeEach, describe, expect, it } from "vitest";
import { createSession, handleTurn } from "@/agents/conversation-state-machine";
import { ingestPolicyDocument } from "@/ingestion/ingestPolicyDocument";
import { clearTelemetryLog, getTelemetryLog } from "@/telemetry/schema";

const { builtBranches } = ingestPolicyDocument({ domain: "parking-permits" });

describe("conversation state machine", () => {
  beforeEach(() => {
    clearTelemetryLog();
  });

  it("walks a resident permit application through to an approved outcome", async () => {
    let session = createSession("session-1");

    let result = await handleTurn(
      session,
      "I just moved in and want to apply for a new resident parking permit for my car",
      builtBranches
    );
    session = result.session;
    expect(session.state).toBe("collecting_requirement");
    expect(session.matchedBranchId).toBe("parking.resident.standard-application");
    expect(result.serviceResolved?.branchId).toBe("parking.resident.standard-application");

    result = await handleTurn(session, "123 Beach Road, Bayside Harbour", builtBranches);
    session = result.session;
    expect(session.capturedValues.address).toBeTruthy();

    result = await handleTurn(session, "ABC123", builtBranches);
    session = result.session;
    expect(session.capturedValues.vehicle_rego).toBe("ABC123");

    result = await handleTurn(session, "owner", builtBranches);
    session = result.session;
    expect(session.capturedValues.resident_status).toBe("owner");

    result = await handleTurn(session, "1", builtBranches);
    session = result.session;
    expect(session.capturedValues.existing_permits).toBe(1);

    result = await handleTurn(session, "yes", builtBranches);
    session = result.session;

    expect(session.state).toBe("complete");
    expect(session.caseObject?.outcome.key).toBe("approved_pending_payment");
    expect(session.caseObject?.requiresStaffReview).toBe(false);

    const eventTypes = getTelemetryLog().map((e) => e.type);
    expect(eventTypes).toContain("session_start");
    expect(eventTypes).toContain("intent_matched");
    expect(eventTypes).toContain("decision_reached");
    expect(eventTypes).toContain("handoff_complete");
  });

  it("declines a resident application once the address is at its permit cap", async () => {
    let session = createSession("session-2");

    let result = await handleTurn(
      session,
      "I just moved in and want to apply for a new resident parking permit for my car",
      builtBranches
    );
    session = result.session;

    result = await handleTurn(session, "45 Harbour Street", builtBranches);
    session = result.session;
    result = await handleTurn(session, "XYZ789", builtBranches);
    session = result.session;
    result = await handleTurn(session, "tenant", builtBranches);
    session = result.session;
    result = await handleTurn(session, "3", builtBranches); // existing_permits
    session = result.session;
    result = await handleTurn(session, "yes", builtBranches); // has off-street parking -> max 2
    session = result.session;

    expect(session.state).toBe("complete");
    expect(session.caseObject?.outcome.key).toBe("declined");
  });

  it("re-asks the same requirement when the answer fails validation", async () => {
    let session = createSession("session-3");

    let result = await handleTurn(
      session,
      "I just moved in and want to apply for a new resident parking permit for my car",
      builtBranches
    );
    session = result.session;

    // Address requirement expects a street-number-like string; this should be rejected.
    result = await handleTurn(session, "somewhere near the harbour", builtBranches);
    session = result.session;

    expect(session.state).toBe("collecting_requirement");
    expect(session.currentRequirementId).toBe("address");
    expect(session.capturedValues.address).toBeUndefined();
    expect(result.guideMessage).toMatch(/didn't look right/i);
  });

  it("escalates immediately when hardship language appears, even mid-flow on an ordinary branch", async () => {
    let session = createSession("session-4");

    let result = await handleTurn(
      session,
      "I just moved in and want to apply for a new resident parking permit for my car",
      builtBranches
    );
    session = result.session;
    expect(session.state).toBe("collecting_requirement");

    result = await handleTurn(
      session,
      "Actually I should mention I'm really struggling financially and can't afford the fee",
      builtBranches
    );
    session = result.session;

    expect(session.state).toBe("escalated");
    expect(session.escalation?.reason).toBe("hardship_safeguarding");
    expect(session.caseObject).toBeNull();

    const eventTypes = getTelemetryLog().map((e) => e.type);
    expect(eventTypes).toContain("tier0_escalated");
  });

  it("escalates a hardship/waiver request the moment the branch itself is matched", async () => {
    let session = createSession("session-5");

    const result = await handleTurn(
      session,
      "I'd like to request a fee waiver for my parking permit due to financial hardship",
      builtBranches
    );
    session = result.session;

    expect(session.state).toBe("escalated");
    expect(session.escalation).not.toBeNull();
  });

  it("routes a disability permit application to staff review rather than an automated decision", async () => {
    let session = createSession("session-6");

    let result = await handleTurn(session, "I need to apply for a disability parking permit", builtBranches);
    session = result.session;
    expect(session.state).toBe("collecting_requirement");
    expect(session.matchedBranchId).toBe("parking.disability");

    result = await handleTurn(session, "Jordan Smith", builtBranches);
    session = result.session;
    result = await handleTurn(session, "12 Esplanade, Bayside Harbour", builtBranches);
    session = result.session;
    result = await handleTurn(session, "yes", builtBranches);
    session = result.session;
    result = await handleTurn(session, "Dr Patel, 2 June 2026", builtBranches);
    session = result.session;

    expect(session.state).toBe("complete");
    expect(session.caseObject?.outcome.key).toBe("staff_review_required");
    expect(session.caseObject?.requiresStaffReview).toBe(true);
  });

  it("asks a clarifying question instead of guessing when intent is ambiguous", async () => {
    let session = createSession("session-7");

    const result = await handleTurn(session, "hi there", builtBranches);
    session = result.session;

    expect(session.state).toBe("clarifying");
    expect(session.caseObject).toBeNull();
  });
});
