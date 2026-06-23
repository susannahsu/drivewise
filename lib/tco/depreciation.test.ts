import { describe, it, expect } from "vitest";
import type { Vehicle } from "@/lib/schema";
import { resaleValue, depreciation } from "./depreciation";

const car: Vehicle = {
  id: "test",
  make: "Test",
  model: "Car",
  year: 2026,
  powertrain: "gas",
  bodyStyle: "compact",
  msrp: 30000,
  combinedMpg: 35,
  resaleRatio5yr: 0.6,
};

describe("resaleValue", () => {
  it("equals full price at year 0", () => {
    expect(resaleValue(car, 0)).toBeCloseTo(30000);
  });

  it("equals price * ratio5 at year 5", () => {
    expect(resaleValue(car, 5)).toBeCloseTo(18000); // 30000 * 0.6
  });

  it("is monotonically decreasing", () => {
    expect(resaleValue(car, 3)).toBeGreaterThan(resaleValue(car, 7));
  });

  it("falls back to body-style default when no per-vehicle ratio", () => {
    const noRatio = { ...car, resaleRatio5yr: undefined };
    // compact default is 0.55
    expect(resaleValue(noRatio, 5)).toBeCloseTo(30000 * 0.55);
  });
});

describe("depreciation", () => {
  it("is price minus resale value", () => {
    expect(depreciation(car, 5)).toBeCloseTo(30000 - 18000);
  });

  it("is zero at year 0", () => {
    expect(depreciation(car, 0)).toBeCloseTo(0);
  });
});
