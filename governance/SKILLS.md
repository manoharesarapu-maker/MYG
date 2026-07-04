# governance/

Tier 0 (welfare/hardship/safeguarding) detection and escalation. This is
the most important module in the repo — it exists to guarantee that
sensitive interactions are never resolved by model judgement.

`tier0-rules.ts` scans citizen input and current branch metadata on every
turn for hardship/safeguarding signals (keyword match against a curated
list, plus any branch explicitly tagged `tier: 0`). A match short-circuits
the state machine straight to `escalated`, before any question generation
or extraction runs.

## Must never

- Never call Claude from this module. Detection must be deterministic and
  auditable — a hardcoded/curated trigger list and explicit tier tags on
  taxonomy branches, nothing else.
- Never count a Tier 0 interaction as "resolved" or "commercial" in any
  summary/reporting logic elsewhere in the app.
- Never let this module be bypassed by state machine changes elsewhere —
  it must run first, on every turn.

## Extending

- Add new trigger phrases to the curated list in `tier0-rules.ts`.
- Add new Tier 0 branches by setting `tier: 0` and a non-null
  `escalation` reason in the taxonomy YAML — no code change required.
- Any change here must keep `tests/governance/tier0-rules.test.ts` green.
