"use server";

import {
  DrivingProfileSchema,
  UsStateSchema,
  type TcoResult,
} from "@/lib/schema";
import { computeTco } from "@/lib/tco";
import { getMarketInputs } from "@/lib/data/market";
import { SEED_VEHICLES } from "@/lib/models/seed";
import { resaleValueAtAge } from "@/lib/tco/depreciation";

const USED_AGE_YEARS = 3;

export interface AcquisitionInput {
  state: string;
  annualMiles: number;
  ownershipYears: number;
  homeCharging: boolean;
  vehicleId: string;
}

export interface AcquisitionOption {
  key: "finance_new" | "buy_used" | "lease";
  label: string;
  note: string;
  result: TcoResult;
}

export interface AcquisitionAnalysis {
  vehicleLabel: string;
  options: AcquisitionOption[]; // cheapest first
}

export async function compareAcquisition(
  input: AcquisitionInput,
): Promise<AcquisitionAnalysis> {
  const state = UsStateSchema.parse(input.state);
  const profile = DrivingProfileSchema.parse({
    state,
    annualMiles: input.annualMiles,
    ownershipYears: input.ownershipYears,
    homeCharging: input.homeCharging,
    routes: [],
  });
  const vehicle = SEED_VEHICLES.find((v) => v.id === input.vehicleId);
  if (!vehicle) throw new Error(`Unknown vehicle: ${input.vehicleId}`);

  const market = await getMarketInputs(state);
  const usedPrice = Math.round(resaleValueAtAge(vehicle, USED_AGE_YEARS));

  const options: AcquisitionOption[] = [
    {
      key: "finance_new",
      label: "Finance new",
      note: "Eat first-year depreciation, but build equity and keep resale value.",
      result: computeTco(vehicle, profile, market, { mode: "finance" }),
    },
    {
      key: "buy_used",
      label: `Buy used (~${USED_AGE_YEARS}yr old)`,
      note: `Someone else absorbed the depreciation cliff; purchase ~${"$"}${usedPrice.toLocaleString()}. Higher repair risk.`,
      result: computeTco(vehicle, profile, market, {
        mode: "finance",
        purchasePrice: usedPrice,
        startAgeYears: USED_AGE_YEARS,
      }),
    },
    {
      key: "lease",
      label: "Lease",
      note: "Lowest monthly outlay, but you build no equity (resale value $0).",
      result: computeTco(vehicle, profile, market, { mode: "lease" }),
    },
  ];
  options.sort((a, b) => a.result.total - b.result.total);

  return { vehicleLabel: `${vehicle.make} ${vehicle.model}`, options };
}
