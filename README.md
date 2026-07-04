# Guide — Civic Intake Demo (City of Bayside Harbour)

Guide is the citizen-facing conversational intake layer of a civic
intelligence platform for local government. This repository is a
**demo-grade working model**: the file structure, naming conventions, and
code organisation are production-shaped, but the data layer is
hardcoded/mocked — there is no real database and no real council system
integration. Real infrastructure can be dropped in behind the existing
interfaces without restructuring anything.

Read `ARCHITECTURE.md` first — it explains the six internal layers and the
non-negotiable principles this codebase is built around. Read
`DECISIONS.md` for the specific simplifications made in this demo and what
it would take to productionise each one.

## Scope

This demo covers **one domain only: parking permits**, for a fictional
council, **City of Bayside Harbour** (a Port Phillip-flavoured coastal
Melbourne council). Ten parking permit branches are fully built with real
decision logic; the remaining ~43 parking branches and 16 other service
domains exist only as taxonomy stubs, so the platform's intended scale
(281 interactions / 1,404 branches / 17 domains) is visible without being
built out.

Guide only resolves citizen intent, asks clarifying questions, extracts
information, and produces a structured handoff case object. It does not
implement Validator (policy compliance) or Plus (staff back-office) —
those are separate layers, out of scope here.

## Demo login

If a login screen is present: `guide` / `harbour2025`.

## Running locally

```bash
npm install
cp .env.example .env.local   # add your own ANTHROPIC_API_KEY
npm run dev
```

Open `http://localhost:3000` for the citizen-facing chat, and
`http://localhost:3000/explorer` for the taxonomy browser.

## Testing

```bash
npm test
```

Tier 0 governance (`governance/tier0-rules.ts`) and the conversation state
machine both have dedicated unit tests under `tests/`.

## Repository layout

See `ARCHITECTURE.md` for the full data-flow diagram. Each top-level
module (`taxonomy/`, `ingestion/`, `classifiers/`, `agents/`, `handoff/`,
`governance/`, `telemetry/`, `services/`) has its own `SKILLS.md`
describing what it does, what it must never do, and how to extend it.
