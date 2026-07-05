import { ParkingCase, PLACEHOLDER_DATASET_NOTICE } from "@/lib/parking-placeholder-data";

const TRIAGE_LABEL: Record<ParkingCase["triageFlag"], string> = {
  "auto-approve": "Auto-approve",
  "needs-review": "Needs review",
  escalate: "Escalate",
};

export function ValidatorBand({ matchedCase }: { matchedCase: ParkingCase | null }) {
  return (
    <section className="band band-validator">
      <div className="band-header">
        <h2 className="band-title">Validator</h2>
        <span className="band-tag">Policy check</span>
      </div>
      <p className="band-plain">
        What it does: checks the request against the actual rules — once for the citizen, once for staff.
      </p>

      {matchedCase && <div className="placeholder-notice">⚠️ {PLACEHOLDER_DATASET_NOTICE}</div>}

      {!matchedCase ? (
        <p className="guide-placeholder">Waiting for a resolved request from Guide…</p>
      ) : (
        <div className="validator-columns">
          <div className="validator-panel">
            <h4>Citizen view — pre-submission eligibility check</h4>
            <p className={matchedCase.eligible ? "eligible-yes" : "eligible-no"}>
              {matchedCase.eligible ? "Likely eligible" : "Likely not eligible"}
            </p>
            <p>{matchedCase.eligibilityReason}</p>
          </div>
          <div className="validator-panel">
            <h4>Staff view — post-submission triage flag</h4>
            <span className={`triage-tag triage-${matchedCase.triageFlag}`}>
              {TRIAGE_LABEL[matchedCase.triageFlag]}
            </span>
            <p>{matchedCase.triageReason}</p>
          </div>
        </div>
      )}
    </section>
  );
}
