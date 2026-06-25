import { describe, it, expect } from "vitest";
import { rateDeal, type DealInput } from "./deal";

const base: DealInput = {
  msrp: 30000,
  quotedPrice: 30000,
  offeredApr: 0.07,
  marketApr: 0.07,
  termMonths: 60,
  downPayment: 3000,
};

describe("rateDeal — price grading", () => {
  it("flags a price over MSRP as walk-away", () => {
    const v = rateDeal({ ...base, quotedPrice: 32000 });
    expect(v.grade).toBe("walk_away");
    expect(v.priceVsMsrp).toBe(2000);
  });

  it("rates a deep discount + at-market APR as great", () => {
    const v = rateDeal({ ...base, quotedPrice: 30000 * 0.9 });
    expect(v.grade).toBe("great");
  });

  it("rates exactly MSRP with a fair APR as fair", () => {
    const v = rateDeal({ ...base, quotedPrice: 30000, offeredApr: 0.08 });
    expect(v.grade).toBe("fair");
  });
});

describe("rateDeal — financing grading", () => {
  it("flags an APR well over market as walk-away even with a good price", () => {
    const v = rateDeal({
      ...base,
      quotedPrice: 30000 * 0.9, // great price
      offeredApr: 0.12, // 5 points over the 7% market
    });
    expect(v.grade).toBe("walk_away");
    expect(v.aprGap).toBeCloseTo(0.05);
  });

  it("treats at-or-below market APR as great financing", () => {
    const v = rateDeal({ ...base, quotedPrice: 30000 * 0.9, offeredApr: 0.065 });
    expect(v.grade).toBe("great");
  });
});

describe("rateDeal — payment math", () => {
  it("computes a positive monthly payment and interest on a financed balance", () => {
    const v = rateDeal(base);
    expect(v.monthlyPayment).toBeGreaterThan(0);
    expect(v.totalInterest).toBeGreaterThan(0);
  });

  it("zero interest when paying off (no principal)", () => {
    const v = rateDeal({ ...base, quotedPrice: 3000, downPayment: 3000 });
    expect(v.monthlyPayment).toBe(0);
    expect(v.totalInterest).toBe(0);
  });

  it("derives a fair price target a few percent under MSRP", () => {
    const v = rateDeal(base);
    expect(v.fairPriceTarget).toBeLessThan(base.msrp);
    expect(v.fairPriceTarget).toBeGreaterThan(base.msrp * 0.8);
  });
});
