/**
 * Shared types for taxonomy content, as authored under taxonomy/ and
 * returned by ingestion/ingestPolicyDocument. This is the shape every
 * downstream layer (classifiers, agents, handoff, governance) depends on.
 */

export type RequirementType =
  | "address"
  | "rego"
  | "enum"
  | "number"
  | "date"
  | "text"
  | "boolean";

export interface Requirement {
  id: string;
  label: string;
  type: RequirementType;
  required: boolean;
  options?: string[]; // only present when type === "enum"
}

export interface Outcome {
  message_template: string;
}

export type BranchTier = 0 | 1 | 2;

/** A fully-built taxonomy branch with real requirements and decision logic. */
export interface BuiltBranch {
  id: string;
  domain: string;
  parent_interaction: string;
  tier: BranchTier;
  status: "built";
  requirements: Requirement[];
  decision_logic: string[];
  outcomes: Record<string, Outcome>;
  escalation: string | null;
}

/** A metadata-only stub, used to populate the taxonomy explorer. */
export interface StubBranch {
  id: string;
  domain: string;
  parent_interaction: string;
  tier: BranchTier;
  status: "stub";
}

export type TaxonomyBranch = BuiltBranch | StubBranch;

export function isBuiltBranch(branch: TaxonomyBranch): branch is BuiltBranch {
  return branch.status === "built";
}

export interface DomainSummary {
  id: string;
  label: string;
  parent_interactions: number;
  decision_branches: number;
  status: "stub" | "built";
}
