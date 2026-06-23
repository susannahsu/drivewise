import type { UsState } from "@/lib/schema";
import type { MarketInputs } from "@/lib/tco";
import { getElectricityPerKwh, getGasPerGallon } from "./eia";
import { getAutoLoanApr } from "./fred";

/** Which inputs came from a live API vs a fallback estimate. */
export interface PriceProvenance {
  electricity: boolean;
  gas: boolean;
  loan: boolean;
}

/** MarketInputs the engine needs, plus per-source live/estimated provenance. */
export type MarketData = MarketInputs & { live: PriceProvenance };

/**
 * Assemble the live MarketInputs the TCO engine needs for a given state.
 * Each source fetches independently (and falls back on failure), so a single
 * flaky API can't take down the whole recommendation. Call server-side only.
 */
export async function getMarketInputs(state: UsState): Promise<MarketData> {
  const [electricity, gas, loan] = await Promise.all([
    getElectricityPerKwh(state),
    getGasPerGallon(state),
    getAutoLoanApr(),
  ]);
  return {
    gasPricePerGallon: gas.value,
    electricityPricePerKwh: electricity.value,
    loanApr: loan.value,
    live: { electricity: electricity.live, gas: gas.live, loan: loan.live },
  };
}
