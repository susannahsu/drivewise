import { VehicleSchema, type Vehicle } from "@/lib/schema";

/**
 * Representative compact-class vehicles for the powertrain comparison (US-1).
 * Unlike the value seed catalog, this set INCLUDES an EV so the three
 * powertrains can be compared head-to-head — the whole point of US-1 is to show
 * whether an EV makes sense given the household's (no-)home-charging situation.
 *
 * ⚠️ Estimated specs; calibrate against fueleconomy.gov.
 */
const REPRESENTATIVE: Record<"gas" | "hybrid" | "ev", Vehicle> = {
  gas: {
    id: "rep-gas-compact",
    make: "Representative",
    model: "Compact (gas)",
    year: 2026,
    powertrain: "gas",
    bodyStyle: "compact",
    msrp: 24120,
    combinedMpg: 35,
    resaleRatio5yr: 0.58,
  },
  hybrid: {
    id: "rep-hybrid-compact",
    make: "Representative",
    model: "Compact (hybrid)",
    year: 2026,
    powertrain: "hybrid",
    bodyStyle: "compact",
    msrp: 25000,
    combinedMpg: 50,
    resaleRatio5yr: 0.6,
  },
  ev: {
    id: "rep-ev-compact",
    make: "Representative",
    model: "Compact (EV)",
    year: 2026,
    powertrain: "ev",
    bodyStyle: "compact",
    msrp: 35000,
    kwhPer100mi: 28,
    resaleRatio5yr: 0.48,
  },
};

export const REPRESENTATIVE_VEHICLES: Vehicle[] = Object.values(
  REPRESENTATIVE,
).map((v) => VehicleSchema.parse(v));
