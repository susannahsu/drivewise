import type { UsState, Vehicle } from "@/lib/schema";

/**
 * EV purchase incentives — the federal clean-vehicle credit plus notable state
 * rebates. Omitting these makes EVs look systematically worse than they are, so
 * the engine nets them out of the purchase price (see computeTco `incentive`).
 *
 * These are deliberately conservative, documented 2026 ballparks — programs
 * change often and have income/MSRP caps, so the UI always lets the user toggle
 * them off. Not tax advice; confirm current eligibility before relying on them.
 */

/** Federal clean-vehicle credit for a qualifying new EV (full amount). */
export const FEDERAL_EV_CREDIT = 7500;
/** PHEVs typically qualify for a partial credit. */
export const FEDERAL_PHEV_CREDIT = 3750;

/**
 * MSRP caps for federal eligibility: $80k for SUVs/trucks, $55k for everything
 * else. Above the cap, no federal credit.
 */
const FEDERAL_MSRP_CAP_SUV = 80000;
const FEDERAL_MSRP_CAP_CAR = 55000;
const SUV_BODY_STYLES = ["subcompact_suv", "compact_suv", "midsize_suv"];

/** Notable state EV rebates ($, new BEV). Conservative; many have caps/waitlists. */
const STATE_EV_REBATE: Partial<Record<UsState, number>> = {
  MA: 3500, // MOR-EV
  CO: 5000, // state EV tax credit
  NY: 2000, // Drive Clean Rebate
  CT: 2250, // CHEAPR
  NJ: 4000, // Charge Up NJ
  IL: 4000, // EV rebate
  OR: 2500, // Clean Vehicle Rebate
  CA: 2000, // legacy CVRP-level figure
  PA: 2000,
  VT: 2500,
  MD: 3000,
  RI: 2500,
};

export interface IncentiveBreakdown {
  federal: number;
  state: number;
  total: number;
  eligible: boolean;
}

const ZERO: IncentiveBreakdown = {
  federal: 0,
  state: 0,
  total: 0,
  eligible: false,
};

/**
 * Total purchase incentive for a vehicle in a state. Only EVs (full) and PHEVs
 * (partial) qualify; gas/hybrid get nothing. Returns a zeroed breakdown for
 * ineligible vehicles so callers can render it uniformly.
 */
export function evIncentive(vehicle: Vehicle, state: UsState): IncentiveBreakdown {
  if (vehicle.powertrain !== "ev" && vehicle.powertrain !== "phev") return ZERO;

  const cap = SUV_BODY_STYLES.includes(vehicle.bodyStyle)
    ? FEDERAL_MSRP_CAP_SUV
    : FEDERAL_MSRP_CAP_CAR;
  const federal =
    vehicle.msrp > cap
      ? 0
      : vehicle.powertrain === "ev"
        ? FEDERAL_EV_CREDIT
        : FEDERAL_PHEV_CREDIT;

  // State rebates generally apply to BEVs; treat PHEV state rebate as half.
  const stateBase = STATE_EV_REBATE[state] ?? 0;
  const state$ = vehicle.powertrain === "ev" ? stateBase : Math.round(stateBase / 2);

  const total = federal + state$;
  return { federal, state: state$, total, eligible: total > 0 };
}
