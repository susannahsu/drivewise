import { z } from "zod";
import type { UsState } from "@/lib/schema";
import { cached, TTL } from "./cache";
import {
  fallbackElectricityPerKwh,
  fallbackGasPerGallon,
} from "./fallbacks";
import type { Priced } from "./priced";

/**
 * U.S. Energy Information Administration (EIA) Open Data API v2.
 * Free, requires EIA_API_KEY. Electricity is available per state monthly;
 * gasoline is only published for ~9 states + PADD regions, so we fall back to
 * the offline table for uncovered states. See docs/DATA_SOURCES.md.
 *
 * All calls are server-side and cached. Any failure degrades to the fallback
 * rather than throwing — a missing price should never break a recommendation.
 */
const EIA_BASE = "https://api.eia.gov/v2";

// EIA v2 returns the requested metric under its own column name (e.g. "price"),
// not a generic "value" field — so parse rows as loose records and pull the
// column named by the data[0] param.
const EiaResponse = z.object({
  response: z.object({
    data: z.array(z.record(z.string(), z.unknown())),
  }),
});

async function eiaLatestValue(path: string, params: Record<string, string>) {
  const key = process.env.EIA_API_KEY;
  if (!key) return null;
  const url = new URL(`${EIA_BASE}${path}`);
  url.searchParams.set("api_key", key);
  url.searchParams.set("sort[0][column]", "period");
  url.searchParams.set("sort[0][direction]", "desc");
  url.searchParams.set("length", "1");
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) return null;
  const parsed = EiaResponse.safeParse(await res.json());
  if (!parsed.success) return null;
  const column = params["data[0]"]; // the metric's column name, e.g. "price"
  const raw = parsed.data.response.data[0]?.[column];
  const num = raw == null ? NaN : Number(raw);
  return Number.isFinite(num) ? num : null;
}

/** Residential electricity price for a state, in $/kWh. */
export async function getElectricityPerKwh(state: UsState): Promise<Priced> {
  return cached(`elec:${state}`, TTL.ENERGY, async () => {
    try {
      // EIA reports cents/kWh for residential sector ("RES") by state.
      const cents = await eiaLatestValue("/electricity/retail-sales/data/", {
        "facets[stateid][]": state,
        "facets[sectorid][]": "RES",
        "data[0]": "price",
        frequency: "monthly",
      });
      if (cents != null && cents > 0) return { value: cents / 100, live: true };
    } catch {
      /* fall through to fallback */
    }
    return { value: fallbackElectricityPerKwh(state), live: false };
  });
}

/** Regular gasoline price for a state, in $/gallon. */
export async function getGasPerGallon(state: UsState): Promise<Priced> {
  return cached(`gas:${state}`, TTL.ENERGY, async () => {
    // EIA gas coverage is limited; the fallback table fills the gaps. A future
    // pass can map uncovered states to their PADD region. For now we use the
    // fallback unless we later add a verified per-state series mapping.
    return { value: fallbackGasPerGallon(state), live: false };
  });
}
