/** Small presentation helpers shared across the decision views. */

const USD = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const USD_CENTS = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const money = (n: number): string => USD.format(n);
export const moneyCents = (n: number): string => USD_CENTS.format(n);

export const perMile = (n: number): string =>
  `${USD_CENTS.format(n)}/mi`;

/** Human label for a breakdown key. */
export const BREAKDOWN_LABELS: Record<string, string> = {
  depreciation: "Depreciation",
  financingInterest: "Financing interest",
  energy: "Fuel / electricity",
  insurance: "Insurance",
  maintenance: "Maintenance & repairs",
  fees: "Taxes & fees",
  parking: "Parking",
  tolls: "Tolls",
  opportunityCost: "Opportunity cost",
};
