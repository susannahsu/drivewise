/**
 * Transparent rideshare fare model. Uber/Lyft no longer expose a public price
 * API (see docs/DATA_SOURCES.md), so we model fares from their published rate-
 * card structure and let the user calibrate with one real quote. This is good
 * enough for a buy-vs-rideshare crossover decision.
 */

export interface FareModel {
  base: number;
  perMile: number;
  perMinute: number;
  bookingFee: number;
  minFare: number;
  /** Assumed average trip speed, to turn distance into time. */
  avgSpeedMph: number;
}

/** US metro ballpark, 2026. The UI lets users tune these from a real quote. */
export const DEFAULT_FARE_MODEL: FareModel = {
  base: 2.5,
  perMile: 1.3,
  perMinute: 0.35,
  bookingFee: 2.0,
  minFare: 8.0,
  avgSpeedMph: 24,
};

const WEEKS_PER_MONTH = 4.345;

/** Surge multiplier as a function of local time of day ("HH:MM"). */
export function timeSurgeMultiplier(time: string): number {
  const [h, m] = time.split(":").map(Number);
  const t = h + m / 60;
  if (t >= 7 && t < 9.5) return 1.6; // morning rush
  if (t >= 16 && t < 19) return 1.7; // evening rush
  if (t >= 22 || t < 2) return 1.3; // late night
  return 1.0;
}

/** Estimated fare for a single one-way trip. */
export function estimateTripFare(
  miles: number,
  surge: number,
  model: FareModel = DEFAULT_FARE_MODEL,
): number {
  const minutes = (miles / model.avgSpeedMph) * 60;
  const ride = model.base + model.perMile * miles + model.perMinute * minutes;
  return Math.max(model.minFare, ride * surge) + model.bookingFee;
}

export interface CommuteRoute {
  oneWayMiles: number;
  daysPerWeek: number;
  departTime: string; // outbound
  returnTime: string; // inbound
}

/**
 * Monthly cost of replacing a daily round-trip commute with rideshare:
 * one outbound fare (at the depart-time surge) + one return fare (at the
 * return-time surge), per commuting day.
 */
export function monthlyRideshareCost(
  route: CommuteRoute,
  model: FareModel = DEFAULT_FARE_MODEL,
): number {
  const outbound = estimateTripFare(
    route.oneWayMiles,
    timeSurgeMultiplier(route.departTime),
    model,
  );
  const inbound = estimateTripFare(
    route.oneWayMiles,
    timeSurgeMultiplier(route.returnTime),
    model,
  );
  return (outbound + inbound) * route.daysPerWeek * WEEKS_PER_MONTH;
}
