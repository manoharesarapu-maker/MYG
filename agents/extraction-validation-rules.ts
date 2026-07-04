/**
 * Layer 5 — Extraction (deterministic half).
 *
 * Validates a value already extracted from citizen free text against the
 * requirement's expected type/format. Never calls an LLM. An invalid
 * value must trigger a re-ask, never a silent pass-through.
 */

import type { Requirement } from "@/lib/taxonomy-types";

export interface ValidationResult {
  valid: boolean;
  /** Normalized value to store, only present when valid is true. */
  value?: string | number | boolean;
  /** Human-readable reason for failure, only present when valid is false. */
  reason?: string;
}

const YES_WORDS = new Set(["yes", "y", "yeah", "yep", "true", "correct"]);
const NO_WORDS = new Set(["no", "n", "nope", "false", "incorrect"]);

export function validateValue(requirement: Requirement, rawValue: unknown): ValidationResult {
  const text = typeof rawValue === "string" ? rawValue.trim() : rawValue;

  switch (requirement.type) {
    case "text": {
      if (typeof text === "string" && text.length > 0) {
        return { valid: true, value: text };
      }
      return { valid: false, reason: "we need at least a short answer here" };
    }

    case "address": {
      if (typeof text === "string" && text.length > 4 && /\d/.test(text)) {
        return { valid: true, value: text };
      }
      return { valid: false, reason: "that doesn't look like a full street address with a number" };
    }

    case "rego": {
      if (typeof text === "string") {
        const compact = text.replace(/\s+/g, "").toUpperCase();
        if (/^[A-Z0-9]{3,8}$/.test(compact)) {
          return { valid: true, value: compact };
        }
      }
      return { valid: false, reason: "that doesn't look like a valid registration plate" };
    }

    case "enum": {
      if (typeof text === "string" && requirement.options) {
        const match = requirement.options.find((option) => option.toLowerCase() === text.toLowerCase());
        if (match) {
          return { valid: true, value: match };
        }
      }
      return {
        valid: false,
        reason: `please answer with one of: ${(requirement.options ?? []).join(", ")}`,
      };
    }

    case "number": {
      const parsed = typeof text === "number" ? text : Number.parseInt(String(text).replace(/[^0-9-]/g, ""), 10);
      if (Number.isInteger(parsed) && parsed >= 0) {
        return { valid: true, value: parsed };
      }
      return { valid: false, reason: "we need a whole number (0 or more)" };
    }

    case "date": {
      if (typeof text === "string") {
        const parsed = Date.parse(text);
        if (!Number.isNaN(parsed)) {
          return { valid: true, value: new Date(parsed).toISOString().slice(0, 10) };
        }
      }
      return { valid: false, reason: "we couldn't understand that as a date" };
    }

    case "boolean": {
      if (typeof text === "boolean") {
        return { valid: true, value: text };
      }
      if (typeof text === "string") {
        const normalized = text.toLowerCase().trim();
        if (YES_WORDS.has(normalized)) return { valid: true, value: true };
        if (NO_WORDS.has(normalized)) return { valid: true, value: false };
      }
      return { valid: false, reason: "please answer yes or no" };
    }

    default:
      return { valid: false, reason: "unsupported requirement type" };
  }
}
