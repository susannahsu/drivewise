import { describe, it, expect } from "vitest";
import type { DrivingProfile } from "@/lib/schema";
import { SEED_VEHICLES } from "./seed";
import { computeTco, type MarketInputs } from "@/lib/tco";

describe("seed catalog", () => {
  it("has 20 validated, unique vehicles", () => {
    expect(SEED_VEHICLES).toHaveLength(20);
    const ids = new Set(SEED_VEHICLES.map((v) => v.id));
    expect(ids.size).toBe(20);
  });

  it("every vehicle has the efficiency field its powertrain needs", () => {
    for (const v of SEED_VEHICLES) {
      if (v.powertrain === "ev" || v.powertrain === "phev") {
        expect(v.kwhPer100mi).toBeGreaterThan(0);
      }
      if (v.powertrain !== "ev") {
        expect(v.combinedMpg).toBeGreaterThan(0);
      }
    }
  });

  it("runs end-to-end through the TCO engine for every model", () => {
    const profile: DrivingProfile = {
      state: "MA",
      homeCharging: false,
      annualMiles: 12000,
      ownershipYears: 5,
      routes: [],
    };
    const market: MarketInputs = {
      gasPricePerGallon: 3.5,
      electricityPricePerKwh: 0.24,
      loanApr: 0.075,
    };
    for (const v of SEED_VEHICLES) {
      const r = computeTco(v, profile, market);
      expect(r.total).toBeGreaterThan(0);
      expect(r.cumulativeByYear.at(-1)).toBeCloseTo(r.total, 0);
    }
  });
});
