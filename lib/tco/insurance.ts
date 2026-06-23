import type { BodyStyle, UsState } from "@/lib/schema";
import { INSURANCE_BASE_ANNUAL, insuranceStateFactor } from "./defaults";

/**
 * Default annual full-coverage premium = body-style baseline x state factor.
 * This is the surrogate used until the live Apify estimator is wired up
 * (see docs/DATA_SOURCES.md). The UI always lets the user override with a real
 * quote, which is the most accurate input.
 */
export function estimateAnnualInsurance(
  bodyStyle: BodyStyle,
  state: UsState,
): number {
  return INSURANCE_BASE_ANNUAL[bodyStyle] * insuranceStateFactor(state);
}
