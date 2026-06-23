/**
 * Marginal cost of keeping a car you already own, versus buying another. The
 * point of the "don't buy yet" comparison: keeping skips the big depreciation
 * and financing lines a new purchase incurs, so it's usually far cheaper in the
 * near term. We model only the ongoing running costs (the marginal spend),
 * ignoring the old car's now-small continuing depreciation.
 */
export interface KeepCurrentParams {
  annualMiles: number;
  gasPricePerGallon: number;
  currentMpg: number;
  /** Estimated annual maintenance + repairs (older cars cost more). */
  annualMaintenance: number;
  insuranceAnnual: number;
  registrationAnnual: number;
}

export interface KeepCurrentResult {
  perYear: number;
  total: number;
  cumulativeByYear: number[];
}

export function keepCurrentCar(
  params: KeepCurrentParams,
  years: number,
): KeepCurrentResult {
  const energy =
    (params.annualMiles / params.currentMpg) * params.gasPricePerGallon;
  const perYear =
    energy +
    params.annualMaintenance +
    params.insuranceAnnual +
    params.registrationAnnual;

  const cumulativeByYear: number[] = [];
  for (let y = 1; y <= years; y++) cumulativeByYear.push(perYear * y);

  return { perYear, total: perYear * years, cumulativeByYear };
}
