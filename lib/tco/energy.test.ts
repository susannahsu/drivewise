import { describe, it, expect } from "vitest";
import type { Vehicle } from "@/lib/schema";
import {
  annualEnergyCost,
  effectiveElectricityPrice,
  type EnergyPrices,
} from "./energy";
import { PUBLIC_CHARGING_MULTIPLIER } from "./defaults";

const prices: EnergyPrices = { gasPerGallon: 4, electricityPerKwh: 0.16 };

const gasCar: Vehicle = {
  id: "gas",
  make: "X",
  model: "Gas",
  year: 2026,
  powertrain: "gas",
  bodyStyle: "compact",
  msrp: 25000,
  combinedMpg: 40,
};

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

describe("effectiveElectricityPrice", () => {
  it("uses residential rate with home charging", () => {
    expect(effectiveElectricityPrice(0.16, true)).toBe(0.16);
  });
  it("applies the public-charging penalty without home charging", () => {
    expect(effectiveElectricityPrice(0.16, false)).toBeCloseTo(
      0.16 * PUBLIC_CHARGING_MULTIPLIER,
    );
  });
});

describe("annualEnergyCost", () => {
  it("computes gas cost from MPG", () => {
    // 12000 mi / 40 mpg = 300 gal * $4 = $1200
    expect(annualEnergyCost(gasCar, 12000, prices, false)).toBeCloseTo(1200);
  });

  it("EV is cheap WITH home charging", () => {
    // 12000/100 * 28 kWh = 3360 kWh * 0.16 = $537.60
    expect(annualEnergyCost(ev, 12000, prices, true)).toBeCloseTo(537.6);
  });

  it("EV running cost balloons WITHOUT home charging", () => {
    const withHome = annualEnergyCost(ev, 12000, prices, true);
    const noHome = annualEnergyCost(ev, 12000, prices, false);
    expect(noHome).toBeCloseTo(withHome * PUBLIC_CHARGING_MULTIPLIER);
  });

  it("no-home-charging EV can lose to a gas car on energy alone", () => {
    // The whole point of US-1 for an apartment household.
    const evNoHome = annualEnergyCost(ev, 12000, prices, false);
    const gas = annualEnergyCost(gasCar, 12000, prices, false);
    expect(evNoHome).toBeGreaterThan(gas);
  });

  it("throws if a gas vehicle is missing MPG", () => {
    const bad = { ...gasCar, combinedMpg: undefined };
    expect(() => annualEnergyCost(bad, 12000, prices, false)).toThrow();
  });
});
