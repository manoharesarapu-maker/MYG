# agents/

Layer 3-6 orchestration: the deterministic conversation state machine, and
the question generation / extraction pairs that feed it.

- `conversation-state-machine.ts` — explicit, hand-written state machine
  (no agent framework). Every transition is traceable via a telemetry
  event. States: `awaiting_intent -> clarifying -> collecting_requirement
  -> escalated | complete`.
- `question-selection-rules.ts` — deterministic: given a branch and
  already-known answers, picks the next unmet requirement.
- `question-generation-semantic.ts` — Claude call: phrases the selected
  requirement as a natural-language question. Never chooses *what* to ask.
- `extraction-semantic.ts` — Claude call: turns a free-text answer into a
  structured value for the current requirement.
- `extraction-validation-rules.ts` — deterministic: validates the
  extracted value against the requirement's type/format; invalid values
  trigger a re-ask, not a silent pass-through.

## Must never

- Never let `question-generation-semantic.ts` or `extraction-semantic.ts`
  decide branch outcomes, eligibility, or the next state — that's the
  state machine's job, driven by `decision_logic` in the taxonomy.
- Never skip the Tier 0 check (`governance/tier0-rules.ts`) on any turn,
  regardless of current state.
- Never use LangChain/AutoGPT/CrewAI or any agent framework here.

## Extending

- New requirement types: add validation in
  `extraction-validation-rules.ts` and a phrasing case in
  `question-generation-semantic.ts`; the state machine itself shouldn't
  need to change.
