import { describe, it, expect } from "vitest";
import { VehicleSchema } from "@/lib/schema";
import { evIncentive, FEDERAL_EV_CREDIT } from "./incentives";

const ev = VehicleSchema.parse({
  id: "ev",
  make: "Test",
  model: "EV",
  year: 2026,
  powertrain: "ev",
  bodyStyle: "compact",
  msrp: 35000,
  kwhPer100mi: 28,
});

const gas = VehicleSchema.parse({
  id: "gas",
  make: "Test",
  model: "Gas",
  year: 2026,
  powertrain: "gas",
  bodyStyle: "compact",
  msrp: 25000,
  combinedMpg: 35,
});

describe("evIncentive", () => {
  it("gives gas/hybrid cars nothing", () => {
    expect(evIncentive(gas, "MA").total).toBe(0);
    expect(evIncentive(gas, "MA").eligible).toBe(false);
  });

  it("gives an eligible EV the full federal credit", () => {
    expect(evIncentive(ev, "TX").federal).toBe(FEDERAL_EV_CREDIT);
  });

  it("stacks a state rebate on top of federal", () => {
    const ma = evIncentive(ev, "MA");
    expect(ma.state).toBeGreaterThan(0);
    expect(ma.total).toBe(ma.federal + ma.state);
  });

  it("denies the federal credit above the MSRP cap", () => {
    const pricey = VehicleSchema.parse({ ...ev, msrp: 90000 });
    expect(evIncentive(pricey, "TX").federal).toBe(0);
  });
});
