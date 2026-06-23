/**
 * Tiny in-memory TTL cache so we don't hammer external APIs (EIA, FRED,
 * fueleconomy.gov, Auto.dev). Used by the data fetchers in this directory.
 * All external calls happen server-side; never call these APIs from the client.
 *
 * Phase 1: wire up eia.ts, fred.ts, fueleconomy.ts, nhtsa.ts, rideshare-model.ts
 * around this helper. See docs/DATA_SOURCES.md for the freshness policy.
 */
type Entry<T> = { value: T; expiresAt: number };

const store = new Map<string, Entry<unknown>>();

/** Returns the cached value for `key`, or fetches + caches it for `ttlMs`. */
export async function cached<T>(
  key: string,
  ttlMs: number,
  fetcher: () => Promise<T>,
): Promise<T> {
  const hit = store.get(key) as Entry<T> | undefined;
  if (hit && hit.expiresAt > Date.now()) return hit.value;

  const value = await fetcher();
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
  return value;
}

export const TTL = {
  ENERGY: 24 * 60 * 60 * 1000, // electricity/gas — daily
  LOAN_RATES: 7 * 24 * 60 * 60 * 1000, // weekly
  VEHICLE: 30 * 24 * 60 * 60 * 1000, // specs change rarely
} as const;
