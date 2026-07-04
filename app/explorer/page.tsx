import AppHeader from "@/components/AppHeader";
import TaxonomyExplorer from "@/components/TaxonomyExplorer";
import LoginGate from "@/components/LoginGate";
import { ingestPolicyDocument } from "@/ingestion/ingestPolicyDocument";

export default function ExplorerPage() {
  const { builtBranches, stubBranches, domains } = ingestPolicyDocument();

  return (
    <LoginGate>
      <div className="app-shell">
        <AppHeader />
        <main className="app-main">
          <TaxonomyExplorer domains={domains} builtBranches={builtBranches} stubBranches={stubBranches} />
        </main>
      </div>
    </LoginGate>
  );
}
