import { VehicleSchema, type Vehicle } from "@/lib/schema";

/**
 * Seed catalog for US-3 (model picker), drawn from docs/CAR_SHORTLIST.md — the
 * best-value picks for a 1-car, no-home-charging household (hybrids + efficient
 * gas; pure EVs intentionally excluded given public-charging costs).
 *
 * combinedMpg is EPA-calibrated from fueleconomy.gov (scripts/calibrate-mpg.mjs).
 * resaleRatio5yr (5-yr retention) is calibrated to the iSeeCars 2026 depreciation
 * study and CarEdge: anchored to cited model figures — Civic 22.9% dep (~0.77
 * retention), Corolla 25.5% (~0.74), RAV4 25.2% (~0.75), Camry ~36% (~0.62),
 * market avg 41.8% (~0.58) — and scaled by brand/segment for the rest.
 * reliability (0–1) is from scripts/calibrate-reliability.mjs: real NHTSA recall
 * counts plus a 2026 brand reliability baseline (an honest proxy — true model
 * reliability indices are paywalled). MSRP is approximate.
 */
const SEED: Vehicle[] = [
  // Tier 1 — highest value
  { id: "toyota-corolla-hybrid-2026", make: "Toyota", model: "Corolla Hybrid", year: 2026, powertrain: "hybrid", bodyStyle: "compact", msrp: 25000, combinedMpg: 50, resaleRatio5yr: 0.75, reliability: 0.86 },
  // Prius: efficiency champ (EPA 57 combined, base LE FWD). Costs more than the
  // Corolla Hybrid so it rarely wins lowest-TCO, but tops the "best efficiency"
  // lens and holds value well.
  { id: "toyota-prius-2026", make: "Toyota", model: "Prius", year: 2026, powertrain: "hybrid", bodyStyle: "compact", msrp: 28350, combinedMpg: 57, resaleRatio5yr: 0.64, reliability: 0.86 },
  { id: "toyota-corolla-2026", make: "Toyota", model: "Corolla", year: 2026, powertrain: "gas", bodyStyle: "compact", msrp: 24120, combinedMpg: 34, resaleRatio5yr: 0.74, reliability: 0.86 },
  { id: "honda-civic-2026", make: "Honda", model: "Civic", year: 2026, powertrain: "gas", bodyStyle: "compact", msrp: 25890, combinedMpg: 38, resaleRatio5yr: 0.77, reliability: 0.76 },
  // EPA Civic Hybrid ~49 combined (calibration matched the gas "Civic 4Dr" trim)
  { id: "honda-civic-hybrid-2026", make: "Honda", model: "Civic Hybrid", year: 2026, powertrain: "hybrid", bodyStyle: "compact", msrp: 29000, combinedMpg: 49, resaleRatio5yr: 0.78, reliability: 0.76 },
  { id: "mazda-3-2026", make: "Mazda", model: "Mazda3", year: 2026, powertrain: "gas", bodyStyle: "compact", msrp: 25000, combinedMpg: 30, resaleRatio5yr: 0.55, reliability: 0.74 },

  // Tier 2 — excellent value
  { id: "hyundai-elantra-hybrid-2026", make: "Hyundai", model: "Elantra Hybrid", year: 2026, powertrain: "hybrid", bodyStyle: "compact", msrp: 27000, combinedMpg: 50, resaleRatio5yr: 0.52, reliability: 0.66 },
  { id: "kia-k4-2026", make: "Kia", model: "K4", year: 2026, powertrain: "gas", bodyStyle: "compact", msrp: 23535, combinedMpg: 28, resaleRatio5yr: 0.5, reliability: 0.66 },
  { id: "nissan-sentra-2026", make: "Nissan", model: "Sentra", year: 2026, powertrain: "gas", bodyStyle: "compact", msrp: 23845, combinedMpg: 33, resaleRatio5yr: 0.47, reliability: 0.54 },
  { id: "subaru-impreza-2026", make: "Subaru", model: "Impreza", year: 2026, powertrain: "gas", bodyStyle: "compact", msrp: 27790, combinedMpg: 29, resaleRatio5yr: 0.58, reliability: 0.74 },
  { id: "nissan-versa-2026", make: "Nissan", model: "Versa", year: 2026, powertrain: "gas", bodyStyle: "subcompact", msrp: 18585, combinedMpg: 33, resaleRatio5yr: 0.46, reliability: 0.58 },

  // Tier 3 — midsize
  { id: "toyota-camry-hybrid-2026", make: "Toyota", model: "Camry Hybrid", year: 2026, powertrain: "hybrid", bodyStyle: "midsize", msrp: 30295, combinedMpg: 50, resaleRatio5yr: 0.62, reliability: 0.88 },
  { id: "honda-accord-hybrid-2026", make: "Honda", model: "Accord Hybrid", year: 2026, powertrain: "hybrid", bodyStyle: "midsize", msrp: 33000, combinedMpg: 48, resaleRatio5yr: 0.58, reliability: 0.76 },
  { id: "hyundai-sonata-2026", make: "Hyundai", model: "Sonata", year: 2026, powertrain: "gas", bodyStyle: "midsize", msrp: 27000, combinedMpg: 27, resaleRatio5yr: 0.46, reliability: 0.66 },

  // Tier 4 — compact SUV / crossover
  { id: "toyota-corolla-cross-hybrid-2026", make: "Toyota", model: "Corolla Cross Hybrid", year: 2026, powertrain: "hybrid", bodyStyle: "subcompact_suv", msrp: 29000, combinedMpg: 42, resaleRatio5yr: 0.7, reliability: 0.9 },
  { id: "honda-hr-v-2026", make: "Honda", model: "HR-V", year: 2026, powertrain: "gas", bodyStyle: "subcompact_suv", msrp: 27950, combinedMpg: 27, resaleRatio5yr: 0.62, reliability: 0.74 },
  { id: "hyundai-venue-2026", make: "Hyundai", model: "Venue", year: 2026, powertrain: "gas", bodyStyle: "subcompact_suv", msrp: 22150, combinedMpg: 31, resaleRatio5yr: 0.5, reliability: 0.66 },
  { id: "kia-sportage-hybrid-2026", make: "Kia", model: "Sportage Hybrid", year: 2026, powertrain: "hybrid", bodyStyle: "compact_suv", msrp: 30000, combinedMpg: 35, resaleRatio5yr: 0.55, reliability: 0.6 },
  { id: "mazda-cx-30-2026", make: "Mazda", model: "CX-30", year: 2026, powertrain: "gas", bodyStyle: "subcompact_suv", msrp: 26000, combinedMpg: 26, resaleRatio5yr: 0.57, reliability: 0.76 },
  { id: "subaru-crosstrek-2026", make: "Subaru", model: "Crosstrek", year: 2026, powertrain: "gas", bodyStyle: "compact_suv", msrp: 28000, combinedMpg: 29, resaleRatio5yr: 0.66, reliability: 0.74 },
  { id: "toyota-rav4-hybrid-2026", make: "Toyota", model: "RAV4 Hybrid", year: 2026, powertrain: "hybrid", bodyStyle: "compact_suv", msrp: 33000, combinedMpg: 38, resaleRatio5yr: 0.75, reliability: 0.84 },
];

/** Validated seed catalog. Throws at import time if an entry is malformed. */
export const SEED_VEHICLES: Vehicle[] = SEED.map((v) => VehicleSchema.parse(v));
