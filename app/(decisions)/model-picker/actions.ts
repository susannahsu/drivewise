"use server";

import {
  DrivingProfileSchema,
  UsStateSchema,
  type TcoResult,
  type Vehicle,
} from "@/lib/schema";
import { computeTco } from "@/lib/tco";
import { getMarketInputs } from "@/lib/data/market";
import { SEED_VEHICLES } from "@/lib/models/seed";
import { RESALE_RATIO_5YR } from "@/lib/tco/defaults";
import type { Objective } from "./objectives";

export interface ModelInput {
  state: string;
  annualMiles: number;
  ownershipYears: number;
  homeCharging: boolean;
  objective: Objective;
}

export interface ModelRow {
  vehicle: Pick<Vehicle, "id" | "make" | "model" | "powertrain" | "bodyStyle" | "msrp" | "combinedMpg">;
  result: TcoResult;
  /** Effective resale-retention ratio used (per-vehicle or segment default). */
  resaleRatio: number;
}

function score(row: ModelRow, objective: Objective): number {
  switch (objective) {
    case "lowest_tco":
      return -row.result.total; // higher score = better, so negate cost
    case "best_efficiency":
      return row.vehicle.combinedMpg ?? 0;
    case "slowest_depreciation":
      return row.resaleRatio;
  }
}

export async function rankModels(input: ModelInput): Promise<ModelRow[]> {
  const state = UsStateSchema.parse(input.state);
  const profile = DrivingProfileSchema.parse({
    state,
    annualMiles: input.annualMiles,
    ownershipYears: input.ownershipYears,
    homeCharging: input.homeCharging,
    routes: [],
  });
  const market = await getMarketInputs(state);

  const rows: ModelRow[] = SEED_VEHICLES.map((vehicle) => ({
    vehicle: {
      id: vehicle.id,
      make: vehicle.make,
      model: vehicle.model,
      powertrain: vehicle.powertrain,
      bodyStyle: vehicle.bodyStyle,
      msrp: vehicle.msrp,
      combinedMpg: vehicle.combinedMpg,
    },
    result: computeTco(vehicle, profile, market),
    resaleRatio: vehicle.resaleRatio5yr ?? RESALE_RATIO_5YR[vehicle.bodyStyle],
  }));

  return rows.sort((a, b) => score(b, input.objective) - score(a, input.objective));
}
