/**
 * The deterministic implementation of each built branch's `decision_logic`
 * (as described in plain English in the taxonomy YAML). This is the only
 * place eligibility/outcome decisions are made -- driven by captured
 * requirement values, never by an LLM.
 *
 * Every branch id here corresponds 1:1 to a `decision_logic` block in
 * taxonomy/parking-permits/*.yaml. Keep them in sync: if you change the
 * prose in the YAML, update the matching evaluator below.
 */

import type { BuiltBranch } from "@/lib/taxonomy-types";

export interface DecisionResult {
  outcomeKey: string;
  message: string;
}

type Evaluator = (capturedValues: Record<string, unknown>) => string;

const evaluators: Record<string, Evaluator> = {
  "parking.resident.standard-application": (values) => {
    const offStreetParking = values.off_street_parking === true;
    const maxAllowed = offStreetParking ? 2 : 3;
    const existingPermits = Number(values.existing_permits ?? 0);
    return existingPermits >= maxAllowed ? "declined" : "approved_pending_payment";
  },

  "parking.resident.renewal": (values) => {
    return values.address_unchanged === false ? "requires_new_application" : "renewed_pending_payment";
  },

  "parking.visitor": (values) => {
    const daysRequested = Number(values.permit_days_requested ?? 0);
    return daysRequested > 90 ? "partial_allocation" : "approved_pending_payment";
  },

  "parking.tradesperson": (values) => {
    const durationDays = Number(values.job_duration_days ?? 0);
    return durationDays > 30 ? "extended_review_required" : "approved_pending_payment";
  },

  "parking.disability": () => "staff_review_required",

  "parking.business": (values) => {
    const existingBusinessPermits = Number(values.existing_business_permits ?? 0);
    return existingBusinessPermits >= 4 ? "declined" : "approved_pending_payment";
  },

  "parking.hardship-waiver": () => "escalated_to_human",

  "parking.lost-stolen-replacement": () => "approved_pending_payment",

  "parking.dispute-appeal": () => "staff_review_required",

  "parking.change-of-vehicle": (values) => {
    return values.old_vehicle_rego === values.new_vehicle_rego ? "no_change_needed" : "approved_updated";
  },
};

export function evaluateDecision(branch: BuiltBranch, capturedValues: Record<string, unknown>): DecisionResult {
  const evaluator = evaluators[branch.id];
  const outcomeKey = evaluator ? evaluator(capturedValues) : Object.keys(branch.outcomes)[0];
  const outcome = branch.outcomes[outcomeKey];

  return {
    outcomeKey,
    message: outcome?.message_template ?? "Your request has been recorded and will be reviewed.",
  };
}
