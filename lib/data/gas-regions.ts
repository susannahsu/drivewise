import type { UsState } from "@/lib/schema";

/**
 * Resolve a state to the EIA gasoline "duoarea" code with the best available
 * granularity: EIA publishes weekly retail gas for 9 states directly; every
 * other state maps to its PADD region (sub-PADD for the East Coast, which EIA
 * breaks into 1A/1B/1C). All codes verified against the live API.
 */

// States EIA covers with their own weekly gas series (code = "S" + postal).
const STATE_GAS_DUOAREA: Partial<Record<UsState, string>> = {
  CA: "SCA",
  CO: "SCO",
  FL: "SFL",
  MA: "SMA",
  MN: "SMN",
  NY: "SNY",
  OH: "SOH",
  TX: "STX",
  WA: "SWA",
};

// Every state → its PADD / sub-PADD region code (the gas fallback granularity).
const REGION_GAS_DUOAREA: Record<UsState, string> = {
  // PADD 1A — New England
  CT: "R1X", ME: "R1X", MA: "R1X", NH: "R1X", RI: "R1X", VT: "R1X",
  // PADD 1B — Central Atlantic
  DE: "R1Y", DC: "R1Y", MD: "R1Y", NJ: "R1Y", NY: "R1Y", PA: "R1Y",
  // PADD 1C — Lower Atlantic
  FL: "R1Z", GA: "R1Z", NC: "R1Z", SC: "R1Z", VA: "R1Z", WV: "R1Z",
  // PADD 2 — Midwest
  IL: "R20", IN: "R20", IA: "R20", KS: "R20", KY: "R20", MI: "R20",
  MN: "R20", MO: "R20", NE: "R20", ND: "R20", OH: "R20", OK: "R20",
  SD: "R20", TN: "R20", WI: "R20",
  // PADD 3 — Gulf Coast
  AL: "R30", AR: "R30", LA: "R30", MS: "R30", NM: "R30", TX: "R30",
  // PADD 4 — Rocky Mountain
  CO: "R40", ID: "R40", MT: "R40", UT: "R40", WY: "R40",
  // PADD 5 — West Coast
  AK: "R50", AZ: "R50", CA: "R50", HI: "R50", NV: "R50", OR: "R50", WA: "R50",
};

export interface GasArea {
  duoarea: string;
  /** True when EIA has a state-specific series; false for a PADD region. */
  stateLevel: boolean;
}

export function gasDuoarea(state: UsState): GasArea {
  const stateCode = STATE_GAS_DUOAREA[state];
  if (stateCode) return { duoarea: stateCode, stateLevel: true };
  return { duoarea: REGION_GAS_DUOAREA[state], stateLevel: false };
}
