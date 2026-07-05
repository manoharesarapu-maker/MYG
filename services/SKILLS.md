# services/

Lambda-shaped handlers, even though this demo runs on Vercel. Each
subdirectory is one service with a single `handler.ts` entry point, the
same shape it would have as a standalone Lambda in production.

`guide-orchestrator/handler.ts` ties one conversational turn together:
classifiers -> governance -> agents -> handoff, called from
`app/api/guide/route.ts`.

## Must never

- Never let this handler contain business logic itself — it orchestrates
  calls into `classifiers/`, `governance/`, `agents/`, and `handoff/`, all
  of which own their own logic.

## Extending

- New services (e.g. a future `validator-orchestrator`) should follow the
  same `handler.ts` entry-point convention.
