/**
 * Taxonomy browser: shows the platform's intended scale (281 parent
 * interactions / 1,404 decision branches / 17 domains) alongside which
 * branches are actually built vs stubbed for this demo. Purely
 * presentational -- no client-side state needed, so this stays a plain
 * (server-renderable) component using native <details>/<summary> for
 * expand/collapse.
 */

import type { BuiltBranch, DomainSummary, StubBranch } from "@/lib/taxonomy-types";

interface TaxonomyExplorerProps {
  domains: DomainSummary[];
  builtBranches: BuiltBranch[];
  stubBranches: StubBranch[];
}

export default function TaxonomyExplorer({ domains, builtBranches, stubBranches }: TaxonomyExplorerProps) {
  const totalParentInteractions = domains.reduce((sum, d) => sum + d.parent_interactions, 0);
  const totalDecisionBranches = domains.reduce((sum, d) => sum + d.decision_branches, 0);

  return (
    <div>
      <div className="explorer-scale-banner">
        <div className="stat">
          <div className="number">{domains.length}</div>
          <div className="label">Service domains mapped</div>
        </div>
        <div className="stat">
          <div className="number">{totalParentInteractions}</div>
          <div className="label">Parent interactions mapped</div>
        </div>
        <div className="stat">
          <div className="number">{totalDecisionBranches}</div>
          <div className="label">Decision branches mapped</div>
        </div>
        <div className="stat">
          <div className="number">{builtBranches.length}</div>
          <div className="label">Branches fully built in this demo</div>
        </div>
      </div>

      <div className="explorer-plain-terms">
        <strong>In plain terms:</strong> this demo only builds real logic for parking permits — the 10 branches
        marked "built" below. Everything else you see here (the other 43 parking branches, and all 16 other
        service domains) is a placeholder that shows where the platform is headed, not something a citizen can
        use yet.
      </div>

      <div className="domain-list">
        {domains.map((domain) => {
          const isParking = domain.id === "parking-permits";
          const domainBuilt = isParking ? builtBranches : [];
          const domainStubs = stubBranches.filter((b) => b.domain === domain.id);

          return (
            <details className="domain-row" key={domain.id} open={isParking}>
              <summary>
                <span>
                  {domain.label}{" "}
                  <span className={`status-badge${domain.status === "built" ? " built" : ""}`}>
                    {domain.status === "built" ? "built" : "stub"}
                  </span>
                </span>
                <span className="domain-counts">
                  {domain.parent_interactions} parent interactions / {domain.decision_branches} decision branches
                </span>
              </summary>

              <div className="branch-list">
                {domainBuilt.map((branch) => (
                  <div className="branch-row" key={branch.id}>
                    <span className="branch-label">{branch.parent_interaction}</span>
                    <span className={`tier-badge tier-${branch.tier}`}>Tier {branch.tier}</span>
                    <span className="status-badge built">built</span>
                  </div>
                ))}

                {domainStubs.map((branch) => (
                  <div className="branch-row" key={branch.id}>
                    <span className="branch-label">{branch.parent_interaction}</span>
                    <span className={`tier-badge tier-${branch.tier}`}>Tier {branch.tier}</span>
                    <span className="status-badge">stub</span>
                  </div>
                ))}

                {isParking && domain.decision_branches - domainBuilt.length - domainStubs.length > 0 && (
                  <div className="branch-row">
                    <span className="branch-label">
                      + {domain.decision_branches - domainBuilt.length - domainStubs.length} further parking branches
                      identified, not yet itemised for this demo
                    </span>
                  </div>
                )}
                {!isParking && domain.decision_branches - domainStubs.length > 0 && (
                  <div className="branch-row">
                    <span className="branch-label">
                      + {domain.decision_branches - domainStubs.length} further branches identified in this domain,
                      not yet itemised for this demo
                    </span>
                  </div>
                )}
              </div>
            </details>
          );
        })}
      </div>
    </div>
  );
}
