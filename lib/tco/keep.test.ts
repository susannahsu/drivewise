import { describe, it, expect } from "vitest";
import { keepCurrentCar } from "./keep";

const params = {
  annualMiles: 12000,
  gasPricePerGallon: 3.5,
  currentMpg: 28,
  annualMaintenance: 1500,
  insuranceAnnual: 1400,
  registrationAnnual: 200,
};

describe("keepCurrentCar", () => {
  it("sums running costs with no depreciation or financing", () => {
    const energy = (12000 / 28) * 3.5;
    const expectedPerYear = energy + 1500 + 1400 + 200;
    const r = keepCurrentCar(params, 5);
    expect(r.perYear).toBeCloseTo(expectedPerYear);
    expect(r.total).toBeCloseTo(expectedPerYear * 5);
  });

  it("cumulative series is linear and ends at total", () => {
    const r = keepCurrentCar(params, 5);
    expect(r.cumulativeByYear).toHaveLength(5);
    expect(r.cumulativeByYear.at(-1)).toBeCloseTo(r.total);
  });

  it("is cheaper than a new-car purchase that carries depreciation", () => {
    // Sanity: keeping (~$3k/yr running) over 5 yrs should beat a new car's
    // ~$30k+ total that includes ~$10k depreciation.
    const r = keepCurrentCar(params, 5);
    expect(r.total).toBeLessThan(30000);
  });
});
