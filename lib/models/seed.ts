import { VehicleSchema, type Vehicle } from "@/lib/schema";

/**
 * Seed catalog for US-3 (model picker). Sourced from docs/CAR_SHORTLIST.md.
 *
 * ⚠️ Phase-0 status: the entries below are ILLUSTRATIVE placeholders to exercise
 * the schema. MSRP is roughly right; combinedMpg / kwhPer100mi / resaleRatio5yr
 * are rough estimates and MUST be verified against fueleconomy.gov + CarEdge in
 * Phase 1, and expanded to the full 20-car shortlist.
 */
const SEED: Vehicle[] = [
  {
    id: "toyota-corolla-hybrid-2026",
    make: "Toyota",
    model: "Corolla Hybrid",
    year: 2026,
    powertrain: "hybrid",
    bodyStyle: "compact",
    msrp: 25000,
    combinedMpg: 50,
    resaleRatio5yr: 0.6,
  },
  {
    id: "honda-civic-2026",
    make: "Honda",
    model: "Civic",
    year: 2026,
    powertrain: "gas",
    bodyStyle: "compact",
    msrp: 25890,
    combinedMpg: 36,
    resaleRatio5yr: 0.58,
  },
  {
    id: "toyota-rav4-hybrid-2026",
    make: "Toyota",
    model: "RAV4 Hybrid",
    year: 2026,
    powertrain: "hybrid",
    bodyStyle: "compact_suv",
    msrp: 33000,
    combinedMpg: 39,
    resaleRatio5yr: 0.63,
  },
  {
    id: "nissan-versa-2026",
    make: "Nissan",
    model: "Versa",
    year: 2026,
    powertrain: "gas",
    bodyStyle: "subcompact",
    msrp: 18585,
    combinedMpg: 35,
    resaleRatio5yr: 0.5,
  },
  {
    id: "hyundai-venue-2026",
    make: "Hyundai",
    model: "Venue",
    year: 2026,
    powertrain: "gas",
    bodyStyle: "subcompact_suv",
    msrp: 22150,
    combinedMpg: 31,
    resaleRatio5yr: 0.52,
  },
];

/** Validated seed catalog. Throws at import time if an entry is malformed. */
export const SEED_VEHICLES: Vehicle[] = SEED.map((v) => VehicleSchema.parse(v));
