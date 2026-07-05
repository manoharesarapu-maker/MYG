/**
 * ⚠️ PLACEHOLDER DATA — NOT THE REAL COUNCIL DATASET.
 *
 * The brief for this view calls for the real 53-branch parking permit
 * eligibility/triage dataset (Council Service Intelligence Map). That
 * dataset was not available in any connected repo when this view was
 * built, so this file holds a small set of illustrative, clearly-fake
 * cases instead — just enough to make the Guide → Validator → Plus
 * sequence visible. Swap this file for the real dataset before using
 * this view in front of anyone who might mistake it for real policy.
 */

export const PLACEHOLDER_DATASET_NOTICE =
  "PLACEHOLDER DATA — illustrative only, not the real 53-branch parking ruleset.";

export type ParkingCase = {
  id: string;
  label: string;
  citizenPrompt: string;
  eligible: boolean;
  eligibilityReason: string;
  triageFlag: "auto-approve" | "needs-review" | "escalate";
  triageReason: string;
};

export const PLACEHOLDER_PARKING_CASES: ParkingCase[] = [
  {
    id: "case-1",
    label: "Fine appeal — signage obscured",
    citizenPrompt:
      "I want to appeal a parking fine. The no-parking sign was hidden behind a tree.",
    eligible: true,
    eligibilityReason:
      "(placeholder) Obstructed-signage appeals are accepted for initial review.",
    triageFlag: "needs-review",
    triageReason:
      "(placeholder) Requires a staff photo review before a decision is issued.",
  },
  {
    id: "case-2",
    label: "Fine appeal — disability permit displayed",
    citizenPrompt:
      "I want to appeal a parking fine. I had my disability permit displayed but got fined anyway.",
    eligible: true,
    eligibilityReason:
      "(placeholder) Valid-permit-displayed appeals are fast-tracked for review.",
    triageFlag: "auto-approve",
    triageReason:
      "(placeholder) Permit database match found — eligible for automatic reversal.",
  },
  {
    id: "case-3",
    label: "Resident permit application — new address",
    citizenPrompt:
      "I just moved and want to apply for a resident parking permit for my street.",
    eligible: true,
    eligibilityReason:
      "(placeholder) Address falls within a resident permit zone.",
    triageFlag: "needs-review",
    triageReason: "(placeholder) Proof-of-address document still required.",
  },
  {
    id: "case-4",
    label: "Fine appeal — outside appeal window",
    citizenPrompt:
      "I want to appeal a parking fine from four months ago, I only just found it.",
    eligible: false,
    eligibilityReason:
      "(placeholder) Appeal submitted outside the standard appeal window.",
    triageFlag: "escalate",
    triageReason:
      "(placeholder) Out-of-window appeals are routed to a senior officer.",
  },
  {
    id: "case-5",
    label: "Accessible parking bay request",
    citizenPrompt:
      "I want to request an accessible parking bay outside my house.",
    eligible: true,
    eligibilityReason:
      "(placeholder) Initial request meets baseline criteria for assessment.",
    triageFlag: "needs-review",
    triageReason:
      "(placeholder) Requires an in-person accessibility assessment before approval.",
  },
];
