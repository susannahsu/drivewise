import type { DrivingProfile, TcoBreakdown, TcoResult, Vehicle } from "@/lib/schema";
import { resaleValueAtAge } from "./depreciation";
import { annualEnergyCost } from "./energy";
import {
  leasePaymentParts,
  opportunityCost,
  totalLoanInterest,
} from "./financing";
import { estimateAnnualInsurance } from "./insurance";
import { maintenanceForYear } from "./maintenance";
import { salesTax } from "./fees";
import {
  ANNUAL_REGISTRATION,
  DEFAULT_DOWN_PAYMENT_FRACTION,
  DEFAULT_LEASE_RESIDUAL_RATIO,
  DEFAULT_LEASE_TERM_MONTHS,
  DEFAULT_LOAN_TERM_MONTHS,
  OPPORTUNITY_COST_RATE,
} from "./defaults";

/** Live, fast-moving prices — sourced from lib/data/*, injected in. */
export interface MarketInputs {
  gasPricePerGallon: number;
  /** Residential electricity rate; the engine applies the public penalty. */
  electricityPricePerKwh: number;
  /** Auto-loan APR as a decimal, e.g. 0.069. */
  loanApr: number;
}

export type AcquisitionMode = "finance" | "cash" | "lease";

export interface AcquisitionTerms {
  mode: AcquisitionMode;
  /** Price actually paid (defaults to MSRP; set lower for a used purchase). */
  purchasePrice?: number;
  /** Car's age in years at purchase (0 = new). Used cars start older. */
  startAgeYears?: number;
  downPayment?: number;
  loanTermMonths?: number;
  leaseTermMonths?: number;
  /** Lease residual as a fraction of MSRP. */
  leaseResidualRatio?: number;
}

export interface TcoOptions {
  /** Real insurance quote, if the user has one — overrides the estimate. */
  insuranceAnnualOverride?: number;
}

const DEFAULT_TERMS: AcquisitionTerms = { mode: "finance" };

/**
 * Compose a full Total Cost of Ownership over the profile's ownership horizon.
 *
 * The cumulative-by-year series is the source of truth: each line item is
 * accrued per year and summed, so `cumulativeByYear[last]` exactly equals
 * `total` and the break-even charts are guaranteed consistent with the
 * headline number. The horizon is treated in whole years.
 */
export function computeTco(
  vehicle: Vehicle,
  profile: DrivingProfile,
  market: MarketInputs,
  terms: AcquisitionTerms = DEFAULT_TERMS,
  options: TcoOptions = {},
): TcoResult {
  const years = Math.max(1, Math.round(profile.ownershipYears));
  const miles = profile.annualMiles;
  const price = terms.purchasePrice ?? vehicle.msrp;
  const startAge = terms.startAgeYears ?? 0;

  // --- Constant-per-year recurring costs ---
  const energyPerYear = annualEnergyCost(
    vehicle,
    miles,
    {
      gasPerGallon: market.gasPricePerGallon,
      electricityPerKwh: market.electricityPricePerKwh,
    },
    profile.homeCharging,
  );
  const insurancePerYear =
    options.insuranceAnnualOverride ??
    estimateAnnualInsurance(vehicle.bodyStyle, profile.state);
  const parkingPerYear = (profile.parkingMonthly ?? 0) * 12;
  const tollsPerYear = (profile.tollsMonthly ?? 0) * 12;

  // --- Acquisition-mode-specific per-year series ---
  const depByYear: number[] = [];
  const interestByYear: number[] = [];
  let resaleAtEnd = 0;
  let oppCostTotal = 0;
  let upfrontFees = 0;

  if (terms.mode === "lease") {
    const capCost = vehicle.msrp;
    const residual =
      vehicle.msrp * (terms.leaseResidualRatio ?? DEFAULT_LEASE_RESIDUAL_RATIO);
    const leaseTerm = terms.leaseTermMonths ?? DEFAULT_LEASE_TERM_MONTHS;
    const parts = leasePaymentParts(capCost, residual, market.loanApr, leaseTerm);
    // Continuous leasing over the horizon; you never build equity (resale = 0).
    for (let y = 0; y < years; y++) {
      depByYear.push(parts.depreciation * 12);
      interestByYear.push(parts.finance * 12);
    }
    resaleAtEnd = 0;
    // Leases are typically taxed on payments, not a big upfront sum: fold none.
  } else {
    const downPayment =
      terms.downPayment ??
      (terms.mode === "cash" ? price : price * DEFAULT_DOWN_PAYMENT_FRACTION);
    const principal = Math.max(0, price - downPayment);
    const loanTerm = terms.loanTermMonths ?? DEFAULT_LOAN_TERM_MONTHS;
    const interest =
      terms.mode === "cash"
        ? 0
        : totalLoanInterest(principal, market.loanApr, loanTerm);

    // Depreciation accrues along the resale curve; year 1 also absorbs any
    // gap between the price paid and the car's market value at purchase age.
    const valueAtPurchase = resaleValueAtAge(vehicle, startAge);
    for (let y = 0; y < years; y++) {
      const vStart = resaleValueAtAge(vehicle, startAge + y);
      const vEnd = resaleValueAtAge(vehicle, startAge + y + 1);
      let dep = vStart - vEnd;
      if (y === 0) dep += price - valueAtPurchase;
      depByYear.push(dep);
      interestByYear.push(interest / years); // spread evenly across the hold
    }
    resaleAtEnd = resaleValueAtAge(vehicle, startAge + years);

    const capitalTiedUp = terms.mode === "cash" ? price : downPayment;
    oppCostTotal = opportunityCost(capitalTiedUp, OPPORTUNITY_COST_RATE, years);
    upfrontFees = salesTax(price, profile.state);
  }

  // --- Build cumulative series and breakdown together (consistency) ---
  const cumulativeByYear: number[] = [];
  const totals: TcoBreakdown = {
    depreciation: 0,
    financingInterest: 0,
    energy: 0,
    insurance: 0,
    maintenance: 0,
    fees: upfrontFees,
    parking: 0,
    tolls: 0,
    opportunityCost: oppCostTotal,
  };

  let cumulative = upfrontFees + oppCostTotal;
  for (let y = 0; y < years; y++) {
    const maint = maintenanceForYear(vehicle, miles, startAge + y);
    totals.depreciation += depByYear[y];
    totals.financingInterest += interestByYear[y];
    totals.energy += energyPerYear;
    totals.insurance += insurancePerYear;
    totals.maintenance += maint;
    totals.fees += ANNUAL_REGISTRATION;
    totals.parking += parkingPerYear;
    totals.tolls += tollsPerYear;

    cumulative +=
      depByYear[y] +
      interestByYear[y] +
      energyPerYear +
      insurancePerYear +
      maint +
      ANNUAL_REGISTRATION +
      parkingPerYear +
      tollsPerYear;
    cumulativeByYear.push(round(cumulative));
  }

  const total =
    totals.depreciation +
    totals.financingInterest +
    totals.energy +
    totals.insurance +
    totals.maintenance +
    totals.fees +
    totals.parking +
    totals.tolls +
    totals.opportunityCost;

  return {
    vehicleId: vehicle.id,
    horizonYears: years,
    total: round(total),
    perMonth: round(total / (years * 12)),
    perMile: round(total / (miles * years), 4),
    breakdown: roundBreakdown(totals),
    resaleValue: round(resaleAtEnd),
    cumulativeByYear,
  };
}

function round(n: number, dp = 2): number {
  const f = 10 ** dp;
  return Math.round(n * f) / f;
}

function roundBreakdown(b: TcoBreakdown): TcoBreakdown {
  return Object.fromEntries(
    Object.entries(b).map(([k, v]) => [k, round(v)]),
  ) as unknown as TcoBreakdown;
}
