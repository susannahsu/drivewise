import type { UsState } from "@/lib/schema";
import type { MarketInputs } from "@/lib/tco";
import { getElectricityPerKwh, getGasPerGallon } from "./eia";
import { getAutoLoanApr } from "./fred";

/**
 * Assemble the live MarketInputs the TCO engine needs for a given state.
 * Each source fetches independently (and falls back on failure), so a single
 * flaky API can't take down the whole recommendation. Call server-side only.
 */
export async function getMarketInputs(state: UsState): Promise<MarketInputs> {
  const [electricityPricePerKwh, gasPricePerGallon, loanApr] = await Promise.all(
    [getElectricityPerKwh(state), getGasPerGallon(state), getAutoLoanApr()],
  );
  return { gasPricePerGallon, electricityPricePerKwh, loanApr };
}
