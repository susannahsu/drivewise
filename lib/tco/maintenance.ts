import type { Vehicle } from "@/lib/schema";
import {
  MAINTENANCE_AGE_ESCALATION,
  MAINTENANCE_PER_MILE,
} from "./defaults";

/**
 * Maintenance + repair cost for a single year, given the car's age at the start
 * of that year. Baseline $/mile by powertrain, escalated as the car ages
 * (repairs get more frequent/expensive). `vehicleAgeYears` is 0 for the first
 * year of a brand-new car.
 */
export function maintenanceForYear(
  vehicle: Vehicle,
  annualMiles: number,
  vehicleAgeYears: number,
): number {
  const base = MAINTENANCE_PER_MILE[vehicle.powertrain] * annualMiles;
  return base * (1 + MAINTENANCE_AGE_ESCALATION * vehicleAgeYears);
}

/**
 * Total maintenance over `years` of ownership, starting at `startAgeYears`
 * (0 for a new car, higher for a used purchase — used cars cost more to
 * maintain, which is captured by the age escalation).
 */
export function totalMaintenance(
  vehicle: Vehicle,
  annualMiles: number,
  years: number,
  startAgeYears = 0,
): number {
  let total = 0;
  for (let y = 0; y < years; y++) {
    total += maintenanceForYear(vehicle, annualMiles, startAgeYears + y);
  }
  return total;
}
