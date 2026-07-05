"use client";

import { useState } from "react";
import AppHeader from "@/components/AppHeader";
import LoginGate from "@/components/LoginGate";
import { GuideBand } from "@/components/GuideBand";
import { ValidatorBand } from "@/components/ValidatorBand";
import { PlusBand } from "@/components/PlusBand";
import { PLACEHOLDER_PARKING_CASES, ParkingCase } from "@/lib/parking-placeholder-data";
import { matchParkingCase } from "@/lib/match-parking-case";

export default function HowItWorksPage() {
  const [input, setInput] = useState("");
  const [guideResponse, setGuideResponse] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [matchedCase, setMatchedCase] = useState<ParkingCase | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function sendToGuide(text: string) {
    if (!text.trim() || streaming) return;

    setInput(text);
    setGuideResponse("");
    setMatchedCase(null);
    setError(null);
    setStreaming(true);

    try {
      const res = await fetch("/api/how-it-works-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      if (!res.ok || !res.body) {
        setError(await res.text());
        setStreaming(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let full = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        full += decoder.decode(value, { stream: true });
        setGuideResponse(full);
      }

      setStreaming(false);
      setMatchedCase(matchParkingCase(text));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong calling Guide.");
      setStreaming(false);
    }
  }

  return (
    <LoginGate>
      <div className="app-shell">
        <AppHeader />
        <div className="disclaimer-banner">
          This is a team working-session visualization of the MyGuide product shape — not a
          production build, not a stakeholder pitch, and not a reference architecture. Parking
          content shown here is placeholder/illustrative, not the real ruleset.
        </div>

        <main className="page">
          <h1>How MyGuide works</h1>
          <p className="page-intro">
            One citizen request, three layers. Watch it move from Guide to Validator; Plus is
            shown for context only.
          </p>

          <div className="input-panel">
            <div className="preset-row">
              {PLACEHOLDER_PARKING_CASES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className="preset-button"
                  onClick={() => sendToGuide(c.citizenPrompt)}
                  disabled={streaming}
                >
                  {c.label}
                </button>
              ))}
            </div>
            <form
              className="input-row"
              onSubmit={(e) => {
                e.preventDefault();
                sendToGuide(input);
              }}
            >
              <input
                type="text"
                value={input}
                placeholder="Type a citizen request, e.g. I want to appeal a parking fine…"
                onChange={(e) => setInput(e.target.value)}
                disabled={streaming}
              />
              <button type="submit" disabled={streaming || !input.trim()}>
                {streaming ? "Sending…" : "Send to Guide"}
              </button>
            </form>
            {error && <p className="eligible-no">{error}</p>}
          </div>

          <GuideBand response={guideResponse} streaming={streaming} />

          <div className="transition-arrow" aria-hidden>
            ↓
          </div>

          <ValidatorBand matchedCase={matchedCase} />

          <div className="transition-arrow" aria-hidden>
            ↓
          </div>

          <PlusBand />
        </main>
      </div>
    </LoginGate>
  );
}
