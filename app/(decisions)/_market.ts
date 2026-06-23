"use server";

import { UsStateSchema } from "@/lib/schema";
import { getMarketInputs, type MarketData } from "@/lib/data/market";

/**
 * Shared server action: fetch live market prices (with live/estimated
 * provenance) for a state. The TCO engine is pure, so every decision view
 * fetches this once and then recomputes results client-side as sliders move
 * (the `_` prefix keeps this file out of routing).
 */
export async function fetchMarket(state: string): Promise<MarketData> {
  return getMarketInputs(UsStateSchema.parse(state));
}
