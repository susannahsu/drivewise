import type { Vehicle } from "@/lib/schema";
import { RESALE_RATIO_5YR } from "./defaults";

/**
 * Resale value over time, modeled as smooth exponential decay calibrated so the
 * value at year 5 equals the vehicle's 5-year retention ratio:
 *
 *   value(t) = price * ratio5 ^ (t / 5)
 *
 * This is monotonic and lets a per-vehicle `resaleRatio5yr` (from real listings
 * data later) drive the curve, falling back to a body-style default. A
 * first-year "cliff" model could replace this if we want more realism.
 */
export function resaleValueAtAge(vehicle: Vehicle, ageYears: number): number {
  const ratio5 = vehicle.resaleRatio5yr ?? RESALE_RATIO_5YR[vehicle.bodyStyle];
  return vehicle.msrp * Math.pow(ratio5, ageYears / 5);
}

/** Resale value after owning a brand-new car for `years`. */
export function resaleValue(vehicle: Vehicle, years: number): number {
  return resaleValueAtAge(vehicle, years);
}

/** True cost of value lost over the horizon: purchase price − resale value. */
export function depreciation(vehicle: Vehicle, years: number): number {
  return vehicle.msrp - resaleValue(vehicle, years);
}
