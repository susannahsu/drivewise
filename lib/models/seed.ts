import { VehicleSchema, type Vehicle } from "@/lib/schema";

/**
 * Seed catalog for US-3 (model picker), drawn from docs/CAR_SHORTLIST.md — the
 * 20 best-value picks for a 1-car, no-home-charging household (hybrids + efficient
 * gas; pure EVs intentionally excluded given public-charging costs).
 *
 * combinedMpg is EPA-calibrated from fueleconomy.gov (scripts/calibrate-mpg.mjs,
 * run 2026-06). MSRP is approximate and resaleRatio5yr is still an estimate
 * pending a CarEdge calibration pass.
 */
const SEED: Vehicle[] = [
  // Tier 1 — highest value
  { id: "toyota-corolla-hybrid-2026", make: "Toyota", model: "Corolla Hybrid", year: 2026, powertrain: "hybrid", bodyStyle: "compact", msrp: 25000, combinedMpg: 50, resaleRatio5yr: 0.6 },
  { id: "toyota-corolla-2026", make: "Toyota", model: "Corolla", year: 2026, powertrain: "gas", bodyStyle: "compact", msrp: 24120, combinedMpg: 34, resaleRatio5yr: 0.58 },
  { id: "honda-civic-2026", make: "Honda", model: "Civic", year: 2026, powertrain: "gas", bodyStyle: "compact", msrp: 25890, combinedMpg: 38, resaleRatio5yr: 0.58 },
  // EPA Civic Hybrid ~49 combined (calibration matched the gas "Civic 4Dr" trim)
  { id: "honda-civic-hybrid-2026", make: "Honda", model: "Civic Hybrid", year: 2026, powertrain: "hybrid", bodyStyle: "compact", msrp: 29000, combinedMpg: 49, resaleRatio5yr: 0.58 },
  { id: "mazda-3-2026", make: "Mazda", model: "Mazda3", year: 2026, powertrain: "gas", bodyStyle: "compact", msrp: 25000, combinedMpg: 30, resaleRatio5yr: 0.52 },

  // Tier 2 — excellent value
  { id: "hyundai-elantra-hybrid-2026", make: "Hyundai", model: "Elantra Hybrid", year: 2026, powertrain: "hybrid", bodyStyle: "compact", msrp: 27000, combinedMpg: 50, resaleRatio5yr: 0.5 },
  { id: "kia-k4-2026", make: "Kia", model: "K4", year: 2026, powertrain: "gas", bodyStyle: "compact", msrp: 23535, combinedMpg: 28, resaleRatio5yr: 0.48 },
  { id: "nissan-sentra-2026", make: "Nissan", model: "Sentra", year: 2026, powertrain: "gas", bodyStyle: "compact", msrp: 23845, combinedMpg: 33, resaleRatio5yr: 0.47 },
  { id: "subaru-impreza-2026", make: "Subaru", model: "Impreza", year: 2026, powertrain: "gas", bodyStyle: "compact", msrp: 27790, combinedMpg: 29, resaleRatio5yr: 0.52 },
  { id: "nissan-versa-2026", make: "Nissan", model: "Versa", year: 2026, powertrain: "gas", bodyStyle: "subcompact", msrp: 18585, combinedMpg: 33, resaleRatio5yr: 0.5 },

  // Tier 3 — midsize
  { id: "toyota-camry-hybrid-2026", make: "Toyota", model: "Camry Hybrid", year: 2026, powertrain: "hybrid", bodyStyle: "midsize", msrp: 30295, combinedMpg: 50, resaleRatio5yr: 0.52 },
  { id: "honda-accord-hybrid-2026", make: "Honda", model: "Accord Hybrid", year: 2026, powertrain: "hybrid", bodyStyle: "midsize", msrp: 33000, combinedMpg: 48, resaleRatio5yr: 0.52 },
  { id: "hyundai-sonata-2026", make: "Hyundai", model: "Sonata", year: 2026, powertrain: "gas", bodyStyle: "midsize", msrp: 27000, combinedMpg: 27, resaleRatio5yr: 0.48 },

  // Tier 4 — compact SUV / crossover
  { id: "toyota-corolla-cross-hybrid-2026", make: "Toyota", model: "Corolla Cross Hybrid", year: 2026, powertrain: "hybrid", bodyStyle: "subcompact_suv", msrp: 29000, combinedMpg: 42, resaleRatio5yr: 0.58 },
  { id: "honda-hr-v-2026", make: "Honda", model: "HR-V", year: 2026, powertrain: "gas", bodyStyle: "subcompact_suv", msrp: 27950, combinedMpg: 27, resaleRatio5yr: 0.55 },
  { id: "hyundai-venue-2026", make: "Hyundai", model: "Venue", year: 2026, powertrain: "gas", bodyStyle: "subcompact_suv", msrp: 22150, combinedMpg: 31, resaleRatio5yr: 0.52 },
  { id: "kia-sportage-hybrid-2026", make: "Kia", model: "Sportage Hybrid", year: 2026, powertrain: "hybrid", bodyStyle: "compact_suv", msrp: 30000, combinedMpg: 35, resaleRatio5yr: 0.55 },
  { id: "mazda-cx-30-2026", make: "Mazda", model: "CX-30", year: 2026, powertrain: "gas", bodyStyle: "subcompact_suv", msrp: 26000, combinedMpg: 26, resaleRatio5yr: 0.54 },
  { id: "subaru-crosstrek-2026", make: "Subaru", model: "Crosstrek", year: 2026, powertrain: "gas", bodyStyle: "compact_suv", msrp: 28000, combinedMpg: 29, resaleRatio5yr: 0.57 },
  { id: "toyota-rav4-hybrid-2026", make: "Toyota", model: "RAV4 Hybrid", year: 2026, powertrain: "hybrid", bodyStyle: "compact_suv", msrp: 33000, combinedMpg: 38, resaleRatio5yr: 0.63 },
];

/** Validated seed catalog. Throws at import time if an entry is malformed. */
export const SEED_VEHICLES: Vehicle[] = SEED.map((v) => VehicleSchema.parse(v));
