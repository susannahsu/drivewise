import type { Vehicle } from "@/lib/schema";
import { PHEV_ELECTRIC_SHARE, PUBLIC_CHARGING_MULTIPLIER } from "./defaults";

export interface EnergyPrices {
  gasPerGallon: number;
  /** Residential electricity rate ($/kWh). Public penalty applied internally. */
  electricityPerKwh: number;
}

/**
 * Effective electricity price actually paid. With home charging you pay the
 * residential rate; without it (apartment / no charger) you rely on public L2 +
 * DC fast charging, which costs several times more — the factor that usually
 * sinks the EV case for our household.
 */
export function effectiveElectricityPrice(
  residentialPerKwh: number,
  homeCharging: boolean,
): number {
  return homeCharging
    ? residentialPerKwh
    : residentialPerKwh * PUBLIC_CHARGING_MULTIPLIER;
}

/**
 * Annual energy (fuel/electricity) cost for a vehicle.
 *
 * Notes:
 * - EPA kWh/100mi is measured "wall to wheels" (already includes charging
 *   losses), so no extra efficiency factor is applied.
 * - PHEV blends electric and gas miles by PHEV_ELECTRIC_SHARE.
 */
export function annualEnergyCost(
  vehicle: Vehicle,
  annualMiles: number,
  prices: EnergyPrices,
  homeCharging: boolean,
): number {
  const elec = effectiveElectricityPrice(prices.electricityPerKwh, homeCharging);

  const gasCost = (miles: number): number => {
    if (!vehicle.combinedMpg) {
      throw new Error(`Vehicle ${vehicle.id} has no MPG but burns gas`);
    }
    return (miles / vehicle.combinedMpg) * prices.gasPerGallon;
  };

  const electricCost = (miles: number): number => {
    if (!vehicle.kwhPer100mi) {
      throw new Error(`Vehicle ${vehicle.id} has no kWh/100mi but uses electricity`);
    }
    return (miles / 100) * vehicle.kwhPer100mi * elec;
  };

  switch (vehicle.powertrain) {
    case "gas":
    case "hybrid":
      return gasCost(annualMiles);
    case "ev":
      return electricCost(annualMiles);
    case "phev": {
      const electricMiles = annualMiles * PHEV_ELECTRIC_SHARE;
      const gasMiles = annualMiles - electricMiles;
      return electricCost(electricMiles) + gasCost(gasMiles);
    }
  }
}
