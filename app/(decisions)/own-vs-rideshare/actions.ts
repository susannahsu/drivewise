"use server";

import { DrivingProfileSchema, UsStateSchema } from "@/lib/schema";
import { computeTco } from "@/lib/tco";
import { getMarketInputs } from "@/lib/data/market";
import { SEED_VEHICLES } from "@/lib/models/seed";
import {
  estimateTripFare,
  monthlyRideshareCost,
  timeSurgeMultiplier,
  type CommuteRoute,
} from "@/lib/data/rideshare-model";

const WEEKS_PER_MONTH = 4.345;

export interface RideshareInput {
  state: string;
  ownershipYears: number;
  homeCharging: boolean;
  vehicleId: string;
  route: CommuteRoute;
}

export interface RideshareAnalysis {
  vehicleLabel: string;
  commuteAnnualMiles: number;
  ownedMonthly: number;
  rideshareMonthly: number;
  perDayPerWeek: number;
  /** Commuting days/week below which rideshare is cheaper than owning. */
  breakEvenDays: number;
  cheaper: "own" | "rideshare";
}

export async function compareRideshare(
  input: RideshareInput,
): Promise<RideshareAnalysis> {
  const state = UsStateSchema.parse(input.state);
  const vehicle = SEED_VEHICLES.find((v) => v.id === input.vehicleId);
  if (!vehicle) throw new Error(`Unknown vehicle: ${input.vehicleId}`);

  const { route } = input;
  const commuteAnnualMiles = Math.round(
    route.oneWayMiles * 2 * route.daysPerWeek * 52,
  );

  const profile = DrivingProfileSchema.parse({
    state,
    annualMiles: Math.max(1000, commuteAnnualMiles),
    ownershipYears: input.ownershipYears,
    homeCharging: input.homeCharging,
    routes: [],
  });

  const market = await getMarketInputs(state);
  const ownedMonthly = computeTco(vehicle, profile, market).perMonth;

  const rideshareMonthly = monthlyRideshareCost(route);
  // Cost of one commuting day per week, per month — rideshare scales on this.
  const perDayPerWeek =
    (estimateTripFare(route.oneWayMiles, timeSurgeMultiplier(route.departTime)) +
      estimateTripFare(route.oneWayMiles, timeSurgeMultiplier(route.returnTime))) *
    WEEKS_PER_MONTH;
  const breakEvenDays = ownedMonthly / perDayPerWeek;

  return {
    vehicleLabel: `${vehicle.make} ${vehicle.model}`,
    commuteAnnualMiles,
    ownedMonthly,
    rideshareMonthly,
    perDayPerWeek,
    breakEvenDays,
    cheaper: rideshareMonthly < ownedMonthly ? "rideshare" : "own",
  };
}
