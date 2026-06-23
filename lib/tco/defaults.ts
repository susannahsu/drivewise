import type { BodyStyle, Powertrain, UsState } from "@/lib/schema";

/**
 * Central home for every estimated/slow-moving constant in the TCO engine.
 * These are deliberately conservative, documented defaults — the UI lets the
 * user override anything that matters. Live, fast-moving numbers (gas,
 * electricity, loan rates) come from lib/data/* instead, not from here.
 *
 * Sources noted inline; figures are 2026 ballparks and should be refined as we
 * calibrate against fueleconomy.gov, CarEdge, and AAA's annual cost study.
 */

// --- Depreciation ----------------------------------------------------------

/** Fraction of purchase price retained after 5 years, by body style. */
export const RESALE_RATIO_5YR: Record<BodyStyle, number> = {
  subcompact: 0.5,
  compact: 0.55,
  midsize: 0.5,
  subcompact_suv: 0.55,
  compact_suv: 0.58,
  midsize_suv: 0.55,
};

// --- Energy ----------------------------------------------------------------

/**
 * Multiplier applied to the residential electricity rate when the household has
 * NO home charging and relies on public L2 + DC fast charging. Public charging
 * is dramatically pricier than residential — this is the number that usually
 * sinks the EV case for apartment dwellers. (~2.5–3.5x residential is typical.)
 */
export const PUBLIC_CHARGING_MULTIPLIER = 3.0;

/** Share of PHEV miles driven on electricity (rest on gas). EPA utility factor. */
export const PHEV_ELECTRIC_SHARE = 0.5;

// --- Maintenance -----------------------------------------------------------

/**
 * Baseline maintenance + repair cost in dollars per mile, by powertrain.
 * EVs are cheapest (no oil, fewer moving parts); hybrids ~ gas. Source: AAA /
 * CarEdge maintenance studies, rounded.
 */
export const MAINTENANCE_PER_MILE: Record<Powertrain, number> = {
  gas: 0.09,
  hybrid: 0.09,
  phev: 0.08,
  ev: 0.06,
};

/**
 * Repairs rise as a car ages. Cost in year N is scaled by
 * (1 + AGE_ESCALATION * (vehicleAge)). A new car in year 1 ≈ baseline.
 */
export const MAINTENANCE_AGE_ESCALATION = 0.08;

// --- Insurance -------------------------------------------------------------

/** Default annual full-coverage premium by body style (national baseline). */
export const INSURANCE_BASE_ANNUAL: Record<BodyStyle, number> = {
  subcompact: 1700,
  compact: 1750,
  midsize: 1850,
  subcompact_suv: 1800,
  compact_suv: 1900,
  midsize_suv: 2050,
};

/**
 * State cost-of-insurance multiplier vs national average. Only notable outliers
 * listed; everything else defaults to 1.0 via INSURANCE_STATE_FACTOR().
 * Source: Bankrate/Insurify 2026 state averages, approximate.
 */
const INSURANCE_STATE_FACTORS: Partial<Record<UsState, number>> = {
  FL: 1.45,
  LA: 1.5,
  NY: 1.3,
  MI: 1.4,
  CA: 1.25,
  NV: 1.25,
  ME: 0.7,
  VT: 0.7,
  ID: 0.75,
  OH: 0.8,
};

export function insuranceStateFactor(state: UsState): number {
  return INSURANCE_STATE_FACTORS[state] ?? 1.0;
}

// --- Taxes & fees ----------------------------------------------------------

/**
 * State sales/use tax rate applied to a vehicle purchase. Outliers + no-tax
 * states listed; default via vehicleSalesTaxRate(). Approximate combined rates.
 */
const SALES_TAX_RATES: Partial<Record<UsState, number>> = {
  OR: 0.0,
  MT: 0.0,
  NH: 0.0,
  DE: 0.0,
  AK: 0.0,
  CA: 0.0825,
  TX: 0.0625,
  NY: 0.08,
  FL: 0.06,
  WA: 0.088,
};

export function vehicleSalesTaxRate(state: UsState): number {
  return SALES_TAX_RATES[state] ?? 0.06;
}

/** Average annual registration + title/plate fees. */
export const ANNUAL_REGISTRATION = 200;

// --- Financing -------------------------------------------------------------

export const DEFAULT_LOAN_TERM_MONTHS = 60;
export const DEFAULT_DOWN_PAYMENT_FRACTION = 0.1;

/** Lease residual as a fraction of MSRP at end of a 36-month lease (segment avg). */
export const DEFAULT_LEASE_RESIDUAL_RATIO = 0.57;
export const DEFAULT_LEASE_TERM_MONTHS = 36;

/**
 * Real annual return the household could earn on capital not tied up in the car
 * (down payment / cash). Used for opportunity-cost. ~5% is a conservative
 * blended after-tax investment return.
 */
export const OPPORTUNITY_COST_RATE = 0.05;
