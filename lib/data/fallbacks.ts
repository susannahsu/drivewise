import type { UsState } from "@/lib/schema";

/**
 * Offline fallback prices so the app produces sensible numbers before any API
 * keys are configured, or when an external source is unreachable. These are
 * rough 2026 averages — the live fetchers in this directory replace them when
 * available (see docs/DATA_SOURCES.md). The UI always exposes overrides.
 */

/** National-average residential electricity rate ($/kWh). */
export const FALLBACK_ELECTRICITY_PER_KWH = 0.17;

/** Notable state residential electricity rates ($/kWh); others use national. */
const STATE_ELECTRICITY: Partial<Record<UsState, number>> = {
  CA: 0.32,
  MA: 0.31,
  NY: 0.26,
  CT: 0.3,
  HI: 0.43,
  WA: 0.11,
  ID: 0.11,
  TX: 0.15,
  FL: 0.15,
};

export function fallbackElectricityPerKwh(state: UsState): number {
  return STATE_ELECTRICITY[state] ?? FALLBACK_ELECTRICITY_PER_KWH;
}

/** National-average regular gasoline price ($/gallon). */
export const FALLBACK_GAS_PER_GALLON = 3.4;

/** Notable state gas prices ($/gallon); others use national. */
const STATE_GAS: Partial<Record<UsState, number>> = {
  CA: 4.8,
  WA: 4.4,
  OR: 4.0,
  NV: 4.2,
  HI: 4.7,
  TX: 2.9,
  MS: 2.8,
  LA: 2.9,
};

export function fallbackGasPerGallon(state: UsState): number {
  return STATE_GAS[state] ?? FALLBACK_GAS_PER_GALLON;
}

/** Fallback auto-loan APR (new-car, average credit). */
export const FALLBACK_AUTO_LOAN_APR = 0.075;
