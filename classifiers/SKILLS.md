# classifiers/

Matches free-text citizen input to a taxonomy node (Layer 3).

- `semantic-match.ts` — calls Claude to compare citizen input against the
  set of built taxonomy branches, returns candidate matches with a
  confidence score. Structured JSON output only.
- `rules-fallback.ts` — plain keyword/substring matching used when Claude
  is unavailable, errors, or returns a low-confidence/unparseable result.

## Must never

- Never let Claude decide anything beyond "which taxonomy node does this
  resemble, and how confident am I" — no eligibility, no outcomes.
- Never guess on low confidence. Below the confidence threshold, the
  caller must ask a clarifying question instead of picking a branch.
- Never let a malformed Claude response crash the turn — parse
  defensively and fall back to `rules-fallback.ts`.

## Extending

- Add new branches to match against by pointing this module at more
  `taxonomy/` entries — no code change needed for new *built* branches.
