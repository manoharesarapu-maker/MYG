# handoff/

Once every requirement for a matched branch is captured,
`buildCaseObject.ts` produces a structured, complete case object — the
same shape that would be handed to Validator in production.

## Must never

- Never include unvalidated or partially-extracted values in a case
  object — only call this once the state machine confirms the branch is
  complete.
- Never send the case object anywhere in this demo — it is rendered as a
  summary screen, not transmitted.

## Extending

- To wire this to a real downstream system later: replace the "render
  summary" call site with a real submission call; `buildCaseObject`'s
  output shape shouldn't need to change.
