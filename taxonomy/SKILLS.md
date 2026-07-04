# taxonomy/

The intent taxonomy: citizen intents -> branches -> requirements ->
decision logic -> outcomes. This is curated data, authored by hand, and is
the spine of the whole system.

## Must never

- Never be inferred or generated at runtime — it is authored, versioned,
  reviewed content, checked into Git like code.
- Never contain LLM-generated policy content masquerading as authored
  content. If Claude helped draft a branch, a human must review and commit
  it deliberately, the same as any other change to this directory.
- Never let `decision_logic` be prose fed to an LLM to interpret at
  request time — it must be implemented as plain code in `agents/` /
  `governance/`, keyed off this data.

## Extending

- New fully-built branch: copy the schema in `schema.md`, save under
  `parking-permits/<branch-id>.yaml` with `status: built`.
- New stub: add a minimal entry under `parking-permits/stubs/` or
  `other-domains/stubs/` with `status: "not yet built"`.
- Any branch with `tier: 0` must specify a non-null `escalation` reason and
  must have a corresponding test in `tests/governance/`.
