"use server";

import { UsStateSchema } from "@/lib/schema";
import type { MarketInputs } from "@/lib/tco";
import { getMarketInputs } from "@/lib/data/market";

/**
 * Shared server action: fetch live market prices for a state. The TCO engine is
 * pure, so every decision view fetches this once and then recomputes results
 * client-side as sliders move (the `_` prefix keeps this file out of routing).
 */
export async function fetchMarket(state: string): Promise<MarketInputs> {
  return getMarketInputs(UsStateSchema.parse(state));
}
