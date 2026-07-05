# Guide — repo capabilities

What this repo can and can't do today, for anyone picking it up cold.

## Can do

- Resolve free-text citizen input into one of 10 fully-built parking permit
  taxonomy branches (resident standard, resident renewal, visitor,
  tradesperson, disability, business, hardship/waiver, lost/stolen
  replacement, dispute/appeal, change of vehicle) via `classifiers/`.
- Ask one clarifying question at a time, phrased in plain English by
  Claude, driven by deterministic requirement lists in the taxonomy data.
- Extract and validate structured values (addresses, rego numbers,
  dates, enums) from free-text answers.
- Detect Tier 0 (hardship/safeguarding) language on any turn and hard-stop
  into a human escalation path, deterministically, regardless of which
  branch is active.
- Produce a structured case object once a branch's requirements are
  complete, and render it as a human-readable summary with a raw-JSON
  toggle.
- Show a taxonomy explorer (`/explorer`) with the built branches and stub
  entries for the remaining ~43 parking branches and 16 other domains.
- Emit a schema'd telemetry event at every state transition (console +
  in-memory array).

## Cannot do (by design, in this demo)

- No real council system integration — nothing is actually submitted
  anywhere. Handoff produces a case object, full stop.
- No persistence across server restarts — session state is an in-memory
  `Map`, not a database.
- No real document ingestion — `ingestion/ingestPolicyDocument` returns
  pre-authored static YAML, not the output of parsing a real PDF/HTML
  policy document.
- No Validator (policy compliance) or Plus (staff back-office) layers.
- No domains other than parking permits have working decision logic —
  everything else is a stub for demo breadth only.

## Extending this repo

- To add a new fully-built parking branch: author a YAML file under
  `taxonomy/parking-permits/` following `taxonomy/schema.md`, then move
  its stub entry (if any) out of `taxonomy/parking-permits/stubs/`.
- To add a new domain: see `taxonomy/other-domains/stubs/` for the stub
  format, then build out branches the same way as parking permits.
- Do not add LLM calls into `governance/` or the `decision_logic` parts of
  `agents/` — those must stay deterministic. See `ARCHITECTURE.md`.
