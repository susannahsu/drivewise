import { z } from "zod";
import { cached, TTL } from "./cache";
import { FALLBACK_AUTO_LOAN_APR } from "./fallbacks";

/**
 * FRED (St. Louis Fed) API for the average new-car auto-loan finance rate.
 * Free, requires FRED_API_KEY. Series "TERMCBAUTO48NS" is the commercial-bank
 * 48-month new-car loan rate. Returned as a decimal APR (e.g. 0.072).
 * Degrades to the fallback on any failure.
 */
const FRED_SERIES = "TERMCBAUTO48NS";

const FredResponse = z.object({
  observations: z.array(z.object({ value: z.string() })),
});

export async function getAutoLoanApr(): Promise<number> {
  return cached("auto-loan-apr", TTL.LOAN_RATES, async () => {
    const key = process.env.FRED_API_KEY;
    if (!key) return FALLBACK_AUTO_LOAN_APR;
    try {
      const url = new URL("https://api.stlouisfed.org/fred/series/observations");
      url.searchParams.set("series_id", FRED_SERIES);
      url.searchParams.set("api_key", key);
      url.searchParams.set("file_type", "json");
      url.searchParams.set("sort_order", "desc");
      url.searchParams.set("limit", "1");

      const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (!res.ok) return FALLBACK_AUTO_LOAN_APR;
      const parsed = FredResponse.safeParse(await res.json());
      const raw = parsed.success ? parsed.data.observations[0]?.value : undefined;
      const pct = raw ? Number(raw) : NaN;
      // FRED reports the rate as a percent (e.g. 7.2) -> convert to decimal.
      if (Number.isFinite(pct) && pct > 0) return pct / 100;
    } catch {
      /* fall through */
    }
    return FALLBACK_AUTO_LOAN_APR;
  });
}
