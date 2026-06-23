"use server";

import { UsStateSchema } from "@/lib/schema";
import type { MarketInputs } from "@/lib/tco";
import { getMarketInputs } from "@/lib/data/market";

/**
 * Fetch live market prices for a state. Kept thin on purpose: the TCO engine is
 * pure, so the page recomputes results client-side as the sensitivity sliders
 * move — only the price fetch needs the server.
 */
export async function fetchMarket(state: string): Promise<MarketInputs> {
  return getMarketInputs(UsStateSchema.parse(state));
}
