# ingestion/

Turns council policy source material into structured taxonomy content.

In production this parses real documents (PDFs, HTML policy pages) via a
tool like Unstructured.io and maps the result onto the taxonomy schema,
likely backed by Postgres. In this demo, `ingestPolicyDocument()` is
stubbed to read and parse the static YAML under `taxonomy/` and return it
through the same interface a real pipeline would use.

## Must never

- Never let a caller depend on *how* content was ingested — only on the
  `StructuredContent` shape returned. That's what lets a real pipeline
  replace the stub later with zero caller changes.
- Never invent content that isn't in the taxonomy source files.

## Extending

- To back this with a real ingestion pipeline later: implement
  `ingestPolicyDocument(source)` against a real parser/store, keep the
  return type identical, and delete the YAML-reading stub body.
