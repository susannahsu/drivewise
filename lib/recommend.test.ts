import { describe, it, expect } from "vitest";
import { recommend, type GuideAnswers } from "./recommend";
import type { MarketInputs } from "./tco";

const market: MarketInputs = {
  gasPricePerGallon: 3.5,
  electricityPricePerKwh: 0.17,
  loanApr: 0.069,
};

const base: GuideAnswers = {
  state: "MA",
  homeCharging: false,
  oneWayMiles: 12,
  daysPerWeek: 5,
  annualMiles: 12000,
  ownershipYears: 7,
  bodyStylePref: "any",
  budgetMax: 40000,
  objective: "lowest_tco",
};

describe("recommend", () => {
  it("returns a coherent, fully-populated recommendation", () => {
    const r = recommend(base, market);
    expect(["gas", "hybrid", "ev"]).toContain(r.powertrainWinner);
    expect(r.model).toBeTruthy();
    expect(r.acquisition).toHaveLength(3);
    expect(r.headline.length).toBeGreaterThan(0);
    expect(r.rationale.length).toBeGreaterThanOrEqual(4);
  });

  it("acquisition options are sorted cheapest-first", () => {
    const r = recommend(base, market);
    expect(r.acquisition[0].total).toBeLessThanOrEqual(r.acquisition[1].total);
    expect(r.acquisition[1].total).toBeLessThanOrEqual(r.acquisition[2].total);
  });

  it("respects body-style preference", () => {
    const suv = recommend({ ...base, bodyStylePref: "suv" }, market);
    expect(suv.model.bodyStyle).toMatch(/suv/);
  });

  it("respects the budget ceiling", () => {
    const cheap = recommend({ ...base, budgetMax: 24000 }, market);
    expect(cheap.model.msrp).toBeLessThanOrEqual(24000);
  });

  it("without home charging, rarely picks a full EV powertrain", () => {
    const r = recommend(base, market);
    expect(r.powertrainWinner).not.toBe("ev");
  });

  it("flags rideshare when commuting is minimal", () => {
    const r = recommend({ ...base, daysPerWeek: 1, oneWayMiles: 3 }, market);
    expect(r.rideshare.rideshareCheaper).toBe(true);
  });
});
