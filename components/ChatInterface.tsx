"use client";

import { useState } from "react";
import ServiceResolutionCard from "@/components/ServiceResolutionCard";
import VoiceInput from "@/components/VoiceInput";
import type { CaseObject } from "@/handoff/buildCaseObject";

type TimelineItem =
  | { kind: "message"; role: "citizen" | "guide"; text: string }
  | { kind: "service-resolved"; branchId: string; label: string }
  | { kind: "tier0" }
  | { kind: "case-summary"; caseObject: CaseObject };

function createSessionId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `session-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export default function ChatInterface() {
  const [sessionId] = useState(createSessionId);
  const [timeline, setTimeline] = useState<TimelineItem[]>([
    {
      kind: "message",
      role: "guide",
      text: "Hi, I'm Guide. What would you like help with today? For example: applying for or renewing a parking permit.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showRawCase, setShowRawCase] = useState(false);
  const [ended, setEnded] = useState(false);

  async function sendMessage(text: string) {
    if (!text.trim() || loading || ended) return;

    setTimeline((prev) => [...prev, { kind: "message", role: "citizen", text }]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, message: text }),
      });
      const data = await response.json();

      setTimeline((prev) => {
        const next: TimelineItem[] = [...prev];
        if (data.serviceResolved) {
          next.push({ kind: "service-resolved", branchId: data.serviceResolved.branchId, label: data.serviceResolved.label });
        }
        if (data.tier0Escalated) {
          next.push({ kind: "tier0" });
        }
        next.push({ kind: "message", role: "guide", text: data.guideMessage });
        if (data.caseObject) {
          next.push({ kind: "case-summary", caseObject: data.caseObject });
        }
        return next;
      });

      if (data.state === "complete" || data.state === "escalated") {
        setEnded(true);
      }
    } catch (error) {
      setTimeline((prev) => [
        ...prev,
        { kind: "message", role: "guide", text: "Sorry, something went wrong reaching Guide. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="chat-panel">
      <div className="chat-intro">
        <h1>Parking permits — Guide</h1>
        <p>Tell me what you need in your own words. I'll ask a few quick questions and take it from there.</p>
      </div>

      <div className="chat-timeline">
        {timeline.map((item, index) => {
          if (item.kind === "message") {
            return (
              <div key={index} className={`bubble ${item.role}`}>
                {item.text}
              </div>
            );
          }
          if (item.kind === "service-resolved") {
            return <ServiceResolutionCard key={index} label={item.label} />;
          }
          if (item.kind === "tier0") {
            return (
              <div key={index} className="tier0-banner">
                <span className="eyebrow">Passed to a person</span>
                Because this involves financial hardship or a safety concern, Guide has stopped here and a council
                staff member will follow up with you directly rather than this being handled automatically.
              </div>
            );
          }
          if (item.kind === "case-summary") {
            const { caseObject } = item;
            return (
              <div key={index} className="case-summary">
                <h3>
                  Request summary{" "}
                  <span className={`badge ${caseObject.requiresStaffReview ? "staff-review" : "resolved"}`}>
                    {caseObject.requiresStaffReview ? "Staff review" : "Resolved"}
                  </span>
                </h3>
                <div className="outcome-message">{caseObject.outcome.message}</div>
                <table>
                  <tbody>
                    <tr>
                      <td className="label">Service</td>
                      <td>{caseObject.parentInteraction}</td>
                    </tr>
                    <tr>
                      <td className="label">Reference</td>
                      <td>{caseObject.caseId}</td>
                    </tr>
                    {caseObject.requirementAnswers.map((answer) => (
                      <tr key={answer.requirementId}>
                        <td className="label">{answer.label}</td>
                        <td>{String(answer.value)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button type="button" className="raw-toggle" onClick={() => setShowRawCase((v) => !v)}>
                  {showRawCase ? "Hide raw case object" : "View raw case object"}
                </button>
                {showRawCase && <pre>{JSON.stringify(caseObject, null, 2)}</pre>}
              </div>
            );
          }
          return null;
        })}
        {loading && <div className="bubble loading">Guide is typing…</div>}
      </div>

      <form
        className="chat-input-row"
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage(input);
        }}
      >
        <VoiceInput onTranscript={(text) => setInput(text)} />
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={ended ? "This request is complete." : "Type your answer…"}
          disabled={loading || ended}
        />
        <button type="submit" className="send-button" disabled={loading || ended || !input.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}
