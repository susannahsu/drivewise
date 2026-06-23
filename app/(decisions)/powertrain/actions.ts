"use server";

import {
  DrivingProfileSchema,
  UsStateSchema,
  type TcoResult,
  type Vehicle,
} from "@/lib/schema";
import { computeTco, type MarketInputs } from "@/lib/tco";
import { getMarketInputs } from "@/lib/data/market";
import { REPRESENTATIVE_VEHICLES } from "@/lib/models/representative";

export interface PowertrainInput {
  state: string;
  annualMiles: number;
  ownershipYears: number;
  homeCharging: boolean;
}

export interface PowertrainRow {
  vehicle: Pick<Vehicle, "id" | "model" | "powertrain" | "msrp" | "combinedMpg" | "kwhPer100mi">;
  result: TcoResult;
}

export interface PowertrainAnalysis {
  market: MarketInputs;
  rows: PowertrainRow[]; // cheapest first
  effectiveElectricityNote: string;
}

/** Run the powertrain comparison server-side with live prices. */
export async function analyzePowertrain(
  input: PowertrainInput,
): Promise<PowertrainAnalysis> {
  const state = UsStateSchema.parse(input.state);
  const profile = DrivingProfileSchema.parse({
    state,
    annualMiles: input.annualMiles,
    ownershipYears: input.ownershipYears,
    homeCharging: input.homeCharging,
    routes: [],
  });

  const market = await getMarketInputs(state);

  const rows: PowertrainRow[] = REPRESENTATIVE_VEHICLES.map((vehicle) => ({
    vehicle: {
      id: vehicle.id,
      model: vehicle.model,
      powertrain: vehicle.powertrain,
      msrp: vehicle.msrp,
      combinedMpg: vehicle.combinedMpg,
      kwhPer100mi: vehicle.kwhPer100mi,
    },
    result: computeTco(vehicle, profile, market),
  })).sort((a, b) => a.result.total - b.result.total);

  const effectiveElectricityNote = profile.homeCharging
    ? "EV charged at home (residential electricity rate)."
    : "No home charging: EV uses public/DC fast-charging rates (~3x residential), which is why the EV running cost is high.";

  return { market, rows, effectiveElectricityNote };
}
