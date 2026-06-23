/**
 * Financing math: loan amortization, lease payments, and the opportunity cost
 * of capital tied up. All pure functions of their arguments.
 */

/** Standard amortized monthly payment for principal P, annual APR, n months. */
export function monthlyLoanPayment(
  principal: number,
  apr: number,
  termMonths: number,
): number {
  if (principal <= 0) return 0;
  const r = apr / 12;
  if (r === 0) return principal / termMonths;
  return (principal * r) / (1 - Math.pow(1 + r, -termMonths));
}

/** Total interest paid over the full loan term. */
export function totalLoanInterest(
  principal: number,
  apr: number,
  termMonths: number,
): number {
  const payment = monthlyLoanPayment(principal, apr, termMonths);
  return payment * termMonths - principal;
}

/**
 * Monthly lease payment ≈ depreciation portion + finance (rent) portion.
 *   depreciation = (capCost − residual) / term
 *   finance      = (capCost + residual) * moneyFactor
 * Money factor is the lease analog of APR: moneyFactor ≈ APR / 2400.
 */
export function moneyFactorFromApr(apr: number): number {
  return apr / 24; // apr is a decimal here, so /24 == (apr*100)/2400
}

export interface LeasePaymentParts {
  depreciation: number;
  finance: number;
  total: number;
}

/** Monthly lease payment split into its depreciation and finance portions. */
export function leasePaymentParts(
  capCost: number,
  residual: number,
  apr: number,
  termMonths: number,
): LeasePaymentParts {
  const depreciation = (capCost - residual) / termMonths;
  const finance = (capCost + residual) * moneyFactorFromApr(apr);
  return { depreciation, finance, total: depreciation + finance };
}

export function monthlyLeasePayment(
  capCost: number,
  residual: number,
  apr: number,
  termMonths: number,
): number {
  return leasePaymentParts(capCost, residual, apr, termMonths).total;
}

/**
 * Opportunity cost of capital not invested elsewhere. Approximated as the
 * tied-up capital earning `rate` simple interest over the horizon. For a
 * financed purchase that's the down payment; for cash it's the whole price.
 */
export function opportunityCost(
  capitalTiedUp: number,
  rate: number,
  years: number,
): number {
  return capitalTiedUp * rate * years;
}
