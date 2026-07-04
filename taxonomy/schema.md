# Taxonomy branch schema

One YAML file per fully-built branch, under `taxonomy/parking-permits/` (or
a future domain's own directory). Stub entries use a reduced form — see
the bottom of this file.

## Full (`status: built`) branch shape

```yaml
id: parking.resident.standard-application   # dotted, globally unique
domain: parking-permits
parent_interaction: "Apply for a resident parking permit"
tier: 1                     # 0 = safeguarding/hardship, 1 = standard, 2 = requires staff review
status: built                # built | stub
requirements:
  - id: address
    label: "Property address"
    type: address             # see Requirement types below
    required: true
  - id: vehicle_rego
    label: "Vehicle registration number"
    type: rego
    required: true
  - id: resident_status
    label: "Proof of residency"
    type: enum
    options: [owner, tenant]
    required: true
  - id: existing_permits
    label: "Number of existing permits at this address"
    type: number
    required: true
decision_logic:
  # Plain-English description of the rule for human review.
  # The *implementation* of this logic lives in code (agents/, keyed by
  # branch id), never sent to the LLM as instructions to follow.
  - "Max 2 resident permits per address unless dwelling has no off-street parking, in which case max 3"
  - "If existing_permits >= max allowed for address type -> outcome: declined, reason: cap_reached"
  - "Otherwise -> outcome: approved_pending_payment"
outcomes:
  approved_pending_payment:
    message_template: "Your resident parking permit application is approved pending payment of the annual fee."
  declined:
    message_template: "This address has reached its resident permit limit."
escalation: null              # or a Tier 0 / staff-review reason if applicable
```

### Requirement types

| type      | expected shape                          | validated by                          |
|-----------|------------------------------------------|----------------------------------------|
| `address` | street address string                    | non-empty, contains a street-number-like token |
| `rego`    | vehicle registration plate                | alphanumeric, 3-8 chars                |
| `enum`    | one of `options`                          | case-insensitive match against options |
| `number`  | integer                                   | parses as a non-negative integer       |
| `date`    | a calendar date                           | parses to a valid ISO date             |
| `text`    | free text (e.g. reason, description)      | non-empty                              |
| `boolean` | yes/no                                    | maps common yes/no phrasings           |

### Tier values

- `0` — welfare, hardship, or safeguarding. Must have `escalation` set to a
  non-null reason string. Must never be auto-resolved. Must be excluded
  from "resolved"/"commercial" counts.
- `1` — standard, fully automatable branch. `escalation` is `null`.
- `2` — requires staff review. Automated resolution is not attempted; the
  branch's only outcome routes to a "staff will review this" message.
  `escalation` may be a short reason string describing why.

## Stub entry shape (`status: stub`)

Stubs exist purely to populate the taxonomy explorer with the platform's
real scale. No `requirements`, `decision_logic`, or `outcomes` needed.

```yaml
id: parking.short-term-event-bay
domain: parking-permits
parent_interaction: "Request a short-term event parking bay"
tier: 1
status: stub
```
