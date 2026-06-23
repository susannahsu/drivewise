import { describe, it, expect } from "vitest";
import type { DrivingProfile, Vehicle } from "@/lib/schema";
import { computeTco, type MarketInputs } from "./index";

const profile: DrivingProfile = {
  state: "MA",
  homeCharging: false,
  annualMiles: 12000,
  ownershipYears: 5,
  routes: [],
};

const market: MarketInputs = {
  gasPricePerGallon: 3.6,
  electricityPricePerKwh: 0.24,
  loanApr: 0.069,
};

const corollaHybrid: Vehicle = {
  id: "corolla-hybrid",
  make: "Toyota",
  model: "Corolla Hybrid",
  year: 2026,
  powertrain: "hybrid",
  bodyStyle: "compact",
  msrp: 25000,
  combinedMpg: 50,
  resaleRatio5yr: 0.6,
};

const ev: Vehicle = {
  id: "ev",
  make: "Generic",
  model: "EV",
  year: 2026,
  powertrain: "ev",
  bodyStyle: "compact",
  msrp: 40000,
  kwhPer100mi: 28,
  resaleRatio5yr: 0.48,
};

function sumBreakdown(b: Record<string, number>): number {
  return Object.values(b).reduce((a, x) => a + x, 0);
}

describe("computeTco invariants", () => {
  const r = computeTco(corollaHybrid, profile, market);

  it("breakdown sums to total", () => {
    expect(sumBreakdown(r.breakdown)).toBeCloseTo(r.total, 0);
  });

  it("cumulative series ends at the total", () => {
    expect(r.cumulativeByYear.at(-1)).toBeCloseTo(r.total, 0);
  });

  it("cumulative is monotonically increasing", () => {
    for (let i = 1; i < r.cumulativeByYear.length; i++) {
      expect(r.cumulativeByYear[i]).toBeGreaterThan(r.cumulativeByYear[i - 1]);
    }
  });

  it("series length equals the horizon in years", () => {
    expect(r.cumulativeByYear).toHaveLength(5);
  });

  it("perMonth and perMile are consistent with total", () => {
    expect(r.perMonth).toBeCloseTo(r.total / 60, 0);
    expect(r.perMile).toBeCloseTo(r.total / (12000 * 5), 2);
  });
});

describe("the household's actual question (no home charging)", () => {
  it("a $40k EV without home charging costs more to own than a $25k hybrid", () => {
    const hybrid = computeTco(corollaHybrid, profile, market);
    const evCost = computeTco(ev, profile, market);
    expect(evCost.total).toBeGreaterThan(hybrid.total);
  });

  it("depreciation is typically the largest single line item", () => {
    const { breakdown } = computeTco(corollaHybrid, profile, market);
    const max = Math.max(...Object.values(breakdown));
    expect(breakdown.depreciation).toBe(max);
  });
});

describe("acquisition modes", () => {
  it("cash has no financing interest but has opportunity cost", () => {
    const cash = computeTco(corollaHybrid, profile, market, { mode: "cash" });
    expect(cash.breakdown.financingInterest).toBe(0);
    expect(cash.breakdown.opportunityCost).toBeGreaterThan(0);
  });

  it("financing adds interest cost vs cash", () => {
    const cash = computeTco(corollaHybrid, profile, market, { mode: "cash" });
    const fin = computeTco(corollaHybrid, profile, market, { mode: "finance" });
    expect(fin.breakdown.financingInterest).toBeGreaterThan(
      cash.breakdown.financingInterest,
    );
  });

  it("a used car (bought cheaper, older) depreciates less in dollar terms", () => {
    const usedTerms = {
      mode: "finance" as const,
      purchasePrice: 16000,
      startAgeYears: 3,
    };
    const used = computeTco(corollaHybrid, profile, market, usedTerms);
    const neu = computeTco(corollaHybrid, profile, market, { mode: "finance" });
    expect(used.breakdown.depreciation).toBeLessThan(
      neu.breakdown.depreciation,
    );
  });

  it("lease builds no equity (resale value zero)", () => {
    const lease = computeTco(corollaHybrid, profile, market, { mode: "lease" });
    expect(lease.resaleValue).toBe(0);
    expect(sumBreakdown(lease.breakdown)).toBeCloseTo(lease.total, 0);
  });
});
