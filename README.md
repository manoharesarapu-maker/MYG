# MyGuide — team visualization

This repo did not contain the existing `myguide-city` app or the real 53-branch
parking permit dataset (Council Service Intelligence Map) at the time this view
was built, so this is a minimal fresh Next.js scaffold built specifically to
host `/how-it-works` — not the production myguide.city codebase.

## `/how-it-works`

Shows one citizen request moving through three bands: **Guide** (live Claude
API call), **Validator** (rule-based eligibility/triage check), and **Plus**
(static, labeled "deferred"). See `app/how-it-works/page.tsx`.

The parking cases used by the Validator band live in
`lib/parking-placeholder-data.ts` and are explicitly flagged as placeholder —
**not** the real 53-branch dataset. Swap that file for the real dataset before
using this view with anyone who might mistake it for real policy.

This view is illustration only: it shows the shape of the product, not the
shape of the codebase the team will actually write.

## Running locally

```
npm install
cp .env.example .env.local   # then set ANTHROPIC_API_KEY
npm run dev
```

Open `/how-it-works`.
