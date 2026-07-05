# telemetry/

`schema.ts` defines the single, production-shaped telemetry event schema
for the whole app: event types (`session_start`, `intent_matched`,
`question_asked`, `evidence_captured`, `decision_reached`,
`handoff_complete`, `tier0_escalated`, etc.) and their fields.

In this demo, events are logged to the console and pushed to an
in-memory array (`getTelemetryLog()`). In production this would ship to a
real analytics pipeline — the event shape is written so that swap is a
transport change only.

## Must never

- Never emit a state transition without a corresponding telemetry event —
  every transition in `agents/conversation-state-machine.ts` must be
  traceable through this log.
- Never change an existing event's field names without updating every
  emitter — this schema is meant to be stable, like a production contract.

## Extending

- New event types: add to the discriminated union in `schema.ts` first,
  then emit from the relevant call site.
