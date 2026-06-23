import type {
  DrivingProfile,
  TcoResult,
  Vehicle,
} from "@/lib/schema";

/**
 * The TCO engine. Pure function: no I/O. Live data (energy prices, loan rates,
 * insurance) is fetched in lib/data/* and passed in via `inputs`, so the math
 * stays unit-testable and the data sources stay swappable.
 *
 * Phase 1: implement the line items in sibling modules and compose them here.
 *   - depreciation.ts   (resale ratio over horizon)
 *   - energy.ts         (gas / electric / hybrid running cost)
 *   - financing.ts      (loan interest, lease money-factor)
 *   - insurance.ts      (estimate + override)
 *   - maintenance.ts    (segment-based schedule)
 *
 * See docs/SPEC.md §1.2.
 */
export interface TcoInputs {
  /** $/gallon for the profile's state (live, EIA/CollectAPI, or user override). */
  gasPricePerGallon: number;
  /** $/kWh — residential if homeCharging, else blended public/DC rate. */
  electricityPricePerKwh: number;
  /** Annual auto-loan APR as a decimal, e.g. 0.069 (FRED, or user override). */
  loanApr: number;
  /** Annual insurance premium estimate (Apify/MoneyGeek default + override). */
  insuranceAnnual: number;
}

export function computeTco(
  _vehicle: Vehicle,
  _profile: DrivingProfile,
  _inputs: TcoInputs,
): TcoResult {
  // TODO(phase-1): compose the line-item modules into a full TCO result.
  throw new Error("computeTco not yet implemented — see docs/SPEC.md Phase 1");
}
