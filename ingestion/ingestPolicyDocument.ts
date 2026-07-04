/**
 * Layer 1 — Ingestion.
 *
 * In production this parses real council policy documents (PDFs, HTML
 * pages) via a tool like Unstructured.io and maps the result onto the
 * taxonomy schema, backed by Postgres. In this demo, it is stubbed to
 * read the pre-authored static YAML under taxonomy/ and return it
 * through the same interface a real pipeline would use -- so a real
 * ingestion pipeline can replace this file later without any caller
 * change.
 */

import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";
import type { BuiltBranch, DomainSummary, StubBranch } from "@/lib/taxonomy-types";

export interface PolicySource {
  /** Which domain to ingest. Omit to ingest every domain (used by the explorer). */
  domain?: string;
}

export interface StructuredContent {
  builtBranches: BuiltBranch[];
  stubBranches: StubBranch[];
  domains: DomainSummary[];
}

const TAXONOMY_ROOT = path.resolve(process.cwd(), "taxonomy");

function readYaml<T>(filePath: string): T {
  const raw = fs.readFileSync(filePath, "utf8");
  return YAML.parse(raw) as T;
}

function loadBuiltParkingBranches(): BuiltBranch[] {
  const dir = path.join(TAXONOMY_ROOT, "parking-permits");
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".yaml") || f.endsWith(".yml"));

  return files.map((file) => readYaml<BuiltBranch>(path.join(dir, file)));
}

function loadParkingStubBranches(): StubBranch[] {
  const filePath = path.join(TAXONOMY_ROOT, "parking-permits", "stubs", "remaining-branches.yaml");
  const parsed = readYaml<{ branches: StubBranch[] }>(filePath);
  return parsed.branches;
}

function loadOtherDomainStubBranches(): StubBranch[] {
  const filePath = path.join(TAXONOMY_ROOT, "other-domains", "stubs", "sample-branches.yaml");
  const parsed = readYaml<{ branches: StubBranch[] }>(filePath);
  return parsed.branches;
}

function loadDomainSummaries(): DomainSummary[] {
  const filePath = path.join(TAXONOMY_ROOT, "other-domains", "domains.yaml");
  const parsed = readYaml<{
    parking_permits_totals: { parent_interactions: number; decision_branches: number };
    domains: Array<{
      id: string;
      label: string;
      parent_interactions: number;
      decision_branches: number;
      status: "stub";
    }>;
  }>(filePath);

  const parkingSummary: DomainSummary = {
    id: "parking-permits",
    label: "Parking Permits",
    parent_interactions: parsed.parking_permits_totals.parent_interactions,
    decision_branches: parsed.parking_permits_totals.decision_branches,
    status: "built",
  };

  return [parkingSummary, ...parsed.domains];
}

/**
 * Ingests policy/taxonomy content for the given source. `source.domain`
 * currently only meaningfully distinguishes "parking-permits" (the one
 * built domain) from everything else; pass no domain to get the full
 * platform-wide picture for the taxonomy explorer.
 */
export function ingestPolicyDocument(source: PolicySource = {}): StructuredContent {
  const builtBranches = loadBuiltParkingBranches();
  const stubBranches = [...loadParkingStubBranches(), ...loadOtherDomainStubBranches()];
  const domains = loadDomainSummaries();

  if (source.domain) {
    return {
      builtBranches: builtBranches.filter((b) => b.domain === source.domain),
      stubBranches: stubBranches.filter((b) => b.domain === source.domain),
      domains: domains.filter((d) => d.id === source.domain),
    };
  }

  return { builtBranches, stubBranches, domains };
}
