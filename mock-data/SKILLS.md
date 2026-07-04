# mock-data/

Fake data for demoing pre-fill and returning-citizen scenarios
(`citizen-profiles.json`). Not read by any production-shaped interface —
this is demo-only convenience data, distinct from the taxonomy content in
`taxonomy/`.

## Must never

- Never treat this as a stand-in for a real citizen data store — it is
  not behind a repository/DAO interface on purpose, because production
  would source this from an authenticated citizen account system, a
  different integration entirely.

## Extending

- Add more fake profiles as flat JSON entries; keep field names aligned
  with the taxonomy `requirements` types they're meant to pre-fill.
