import { describe, it, expect } from "vitest";
import {
  monthlyLoanPayment,
  totalLoanInterest,
  moneyFactorFromApr,
  monthlyLeasePayment,
  opportunityCost,
} from "./financing";

describe("monthlyLoanPayment", () => {
  it("matches a known amortization figure", () => {
    // $20,000 at 6% APR over 60 months ≈ $386.66/mo
    expect(monthlyLoanPayment(20000, 0.06, 60)).toBeCloseTo(386.66, 1);
  });

  it("handles 0% APR as straight-line", () => {
    expect(monthlyLoanPayment(12000, 0, 60)).toBeCloseTo(200);
  });

  it("is zero for no principal", () => {
    expect(monthlyLoanPayment(0, 0.06, 60)).toBe(0);
  });
});

describe("totalLoanInterest", () => {
  it("is positive and equals payments minus principal", () => {
    const interest = totalLoanInterest(20000, 0.06, 60);
    expect(interest).toBeGreaterThan(0);
    expect(interest).toBeCloseTo(386.66 * 60 - 20000, 0);
  });

  it("is zero at 0% APR", () => {
    expect(totalLoanInterest(12000, 0, 60)).toBeCloseTo(0);
  });
});

describe("moneyFactorFromApr", () => {
  it("converts APR to money factor (APR/2400 convention)", () => {
    // 7.2% APR -> 0.003 money factor
    expect(moneyFactorFromApr(0.072)).toBeCloseTo(0.003);
  });
});

describe("monthlyLeasePayment", () => {
  it("sums depreciation and finance portions", () => {
    // cap 30000, residual 18000, 36mo, 7.2% APR
    // dep = 12000/36 = 333.33; finance = 48000 * 0.003 = 144; total = 477.33
    expect(monthlyLeasePayment(30000, 18000, 0.072, 36)).toBeCloseTo(477.33, 1);
  });
});

describe("opportunityCost", () => {
  it("is capital * rate * years", () => {
    expect(opportunityCost(5000, 0.05, 5)).toBeCloseTo(1250);
  });
});
