import { describe, it, expect, beforeEach } from "vitest";
import { getMarketInputs } from "./market";
import {
  FALLBACK_AUTO_LOAN_APR,
  fallbackElectricityPerKwh,
  fallbackGasPerGallon,
} from "./fallbacks";

// With no API keys set, every source must degrade to its fallback rather than
// throw — a recommendation should never fail because a price API is down.
describe("getMarketInputs (offline / no keys)", () => {
  beforeEach(() => {
    delete process.env.EIA_API_KEY;
    delete process.env.FRED_API_KEY;
  });

  it("returns fallback values for a state without keys", async () => {
    const m = await getMarketInputs("MA");
    expect(m.electricityPricePerKwh).toBeCloseTo(fallbackElectricityPerKwh("MA"));
    expect(m.gasPricePerGallon).toBeCloseTo(fallbackGasPerGallon("MA"));
    expect(m.loanApr).toBeCloseTo(FALLBACK_AUTO_LOAN_APR);
  });

  it("produces a usable, fully-populated MarketInputs", async () => {
    const m = await getMarketInputs("TX");
    expect(m.electricityPricePerKwh).toBeGreaterThan(0);
    expect(m.gasPricePerGallon).toBeGreaterThan(0);
    expect(m.loanApr).toBeGreaterThan(0);
  });
});
