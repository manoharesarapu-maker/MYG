import { PLACEHOLDER_PARKING_CASES, ParkingCase } from "./parking-placeholder-data";

/**
 * Deterministic keyword match against the placeholder dataset — stands in
 * for the real policy/triage check the Validator band would run. No LLM
 * call here: the Validator is meant to look and behave like a rules check,
 * distinct from the Guide band's conversational resolution.
 */
export function matchParkingCase(citizenText: string): ParkingCase {
  const text = citizenText.toLowerCase();

  let best = PLACEHOLDER_PARKING_CASES[0];
  let bestScore = -1;

  for (const c of PLACEHOLDER_PARKING_CASES) {
    const words = c.citizenPrompt.toLowerCase().split(/\W+/).filter(Boolean);
    const score = words.reduce(
      (acc, w) => acc + (w.length > 3 && text.includes(w) ? 1 : 0),
      0
    );
    if (score > bestScore) {
      bestScore = score;
      best = c;
    }
  }

  return best;
}
