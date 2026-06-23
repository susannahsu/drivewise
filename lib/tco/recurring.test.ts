import { describe, it, expect } from "vitest";
import type { Vehicle } from "@/lib/schema";
import { estimateAnnualInsurance } from "./insurance";
import { maintenanceForYear, totalMaintenance } from "./maintenance";
import { salesTax, registrationFees } from "./fees";
import { INSURANCE_BASE_ANNUAL, MAINTENANCE_PER_MILE } from "./defaults";

const ev: Vehicle = {
  id: "ev",
  make: "X",
  model: "EV",
  year: 2026,
  powertrain: "ev",
  bodyStyle: "compact",
  msrp: 40000,
  kwhPer100mi: 28,
};
const gas: Vehicle = { ...ev, id: "gas", powertrain: "gas", combinedMpg: 35 };

describe("estimateAnnualInsurance", () => {
  it("applies the state factor to the baseline", () => {
    // FL factor is 1.45, compact baseline 1750
    expect(estimateAnnualInsurance("compact", "FL")).toBeCloseTo(
      INSURANCE_BASE_ANNUAL.compact * 1.45,
    );
  });
  it("defaults unlisted states to factor 1.0", () => {
    expect(estimateAnnualInsurance("compact", "KS")).toBeCloseTo(
      INSURANCE_BASE_ANNUAL.compact,
    );
  });
});

describe("maintenance", () => {
  it("EVs cost less to maintain than gas at the same mileage", () => {
    expect(maintenanceForYear(ev, 12000, 0)).toBeLessThan(
      maintenanceForYear(gas, 12000, 0),
    );
  });

  it("first year of a new car is the baseline per-mile cost", () => {
    expect(maintenanceForYear(gas, 10000, 0)).toBeCloseTo(
      MAINTENANCE_PER_MILE.gas * 10000,
    );
  });

  it("costs rise with vehicle age", () => {
    expect(maintenanceForYear(gas, 10000, 8)).toBeGreaterThan(
      maintenanceForYear(gas, 10000, 0),
    );
  });

  it("a used car (older start age) costs more to maintain over 5 years", () => {
    const newCar = totalMaintenance(gas, 12000, 5, 0);
    const usedCar = totalMaintenance(gas, 12000, 5, 4);
    expect(usedCar).toBeGreaterThan(newCar);
  });
});

describe("fees", () => {
  it("sales tax uses the state rate", () => {
    expect(salesTax(30000, "TX")).toBeCloseTo(30000 * 0.0625);
  });
  it("no-sales-tax states pay zero", () => {
    expect(salesTax(30000, "OR")).toBe(0);
  });
  it("registration scales with years", () => {
    expect(registrationFees(5)).toBeCloseTo(registrationFees(1) * 5);
  });
});
