# Decisions

Judgment calls made while building this demo, and what it would take to
productionise each one. Nothing here changes the architecture in
`ARCHITECTURE.md` -- these are simplifications within that architecture.

## Session storage is an in-memory `Map`

`services/guide-orchestrator/handler.ts` keeps conversation sessions in a
module-level `Map<sessionId, ConversationSession>`. This means state is
lost on every server restart/redeploy and doesn't work across multiple
server instances. In production this would be a Postgres-backed (or
Redis-backed) session store, keyed the same way, with the same
`ConversationSession` shape read/written through a repository interface.

## Ingestion reads static YAML instead of parsing real documents

`ingestion/ingestPolicyDocument.ts` reads pre-authored YAML from
`taxonomy/` rather than parsing real council policy documents. The
function signature (`ingestPolicyDocument(source): StructuredContent`) is
written so a real implementation -- backed by a tool like
Unstructured.io and a Postgres/pgvector store -- can replace the body of
this function without any caller changes.

## Rules-based classification fallback uses a hand-tuned token-overlap score

`classifiers/rules-fallback.ts` scores candidate branches using an
F1-style token overlap score (shared words / average of both token set
sizes) between the citizen's message and each branch's
`parent_interaction` text. This is a reasonable deterministic fallback for
a 10-branch demo taxonomy, but it does not scale to the full 1,404-branch
taxonomy -- a production fallback would need a proper search index
(e.g. full-text search or a lightweight embedding index) behind the same
interface.

## Semantic modules (classification, question phrasing, extraction) degrade to deterministic behaviour when Claude is unavailable

Every Claude call (`classifiers/semantic-match.ts`,
`agents/question-generation-semantic.ts`, `agents/extraction-semantic.ts`)
is wrapped so a missing API key, network failure, or unparseable response
falls back to a deterministic default (keyword matching, using the
requirement's label directly as the question, or treating the citizen's
raw text as the answer) rather than crashing the conversation turn. This
was a deliberate reliability choice for a demo that needs to run and be
tested without a live network dependency -- production would likely want
tighter retry/backoff behaviour and stronger alerting on repeated
fallback rather than silent degradation.

## Disability and dispute/appeal branches still collect requirements before routing to staff review

Tier 2 branches (`parking.disability`, `parking.dispute-appeal`) walk
through their requirement list like any other branch, but their
`decision_logic` always resolves to a `staff_review_required` outcome --
no eligibility is ever decided automatically. This mirrors the brief's
instruction to defer firm eligibility calls to a "requires staff review"
outcome, while still capturing useful context for the human reviewer.

## Tier 0 (hardship/waiver) branch escalates immediately, without collecting its own requirements

`taxonomy/parking-permits/hardship-waiver.yaml` lists requirements
(name, address, situation description) for documentation purposes, but
the state machine (`agents/conversation-state-machine.ts`) escalates the
moment Tier 0 is detected -- either because the matched branch itself is
tier 0, or because hardship/safeguarding language appears in any message,
on any branch, at any point in the conversation. It does not attempt to
collect those fields first. This is the safest reading of "a hard stop /
escalation path" in the brief: get the citizen to a human as fast as
possible, rather than delaying handoff to finish an intake form.

## Only 10 of the 53 parking permit branches, and none of the other 16 domains, have real logic

Per the brief's scope, only parking permits needed working decision
logic. The remaining ~43 parking branches and all 1,351 branches across
the other 16 domains exist as metadata-only stub entries
(`taxonomy/parking-permits/stubs/remaining-branches.yaml`,
`taxonomy/other-domains/`) so the taxonomy explorer can show the
platform's real intended scale (281 parent interactions / 1,404 decision
branches / 17 domains) without needing to author working logic for all
of it.

## Demo login is a client-side sessionStorage gate, not real authentication

`components/LoginGate.tsx` checks a hardcoded demo username/password
(`guide` / `harbour2025`) client-side and stores a flag in
`sessionStorage`. This is not authentication and would be fully replaced
by a real auth provider (e.g. council SSO) in production.

## Rules-based classification confidence threshold

`classifiers/index.ts` treats a top-candidate confidence below `0.55` as
"not confident enough" and asks a clarifying question instead of
committing to a branch. This threshold was tuned empirically against the
demo's 10 built branches and the deterministic fallback matcher; a real
system would tune this against real classification accuracy data (and
likely use a different threshold for the LLM-backed matcher vs the
keyword fallback, since their confidence scores aren't directly
comparable).
