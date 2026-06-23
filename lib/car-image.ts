/**
 * Fetch a real photo for a make/model from Wikipedia's page-image API (free, no
 * key, CORS-enabled). Returns a thumbnail URL on Wikimedia Commons, or null if
 * the model has no page image. Results are cached in-memory and in-flight
 * requests are de-duplicated so the same model isn't fetched twice.
 */
const cache = new Map<string, string | null>();
const inflight = new Map<string, Promise<string | null>>();

/** Build the Wikipedia article title for a vehicle. */
function articleTitle(make: string, model: string): string {
  const base = model
    .replace(/\b(Plug-in Hybrid|Hybrid|PHEV|EV|AWD|FWD)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  // Some model names already include the make (e.g. "Mazda3").
  if (base.toLowerCase().startsWith(make.toLowerCase())) return base;
  return `${make} ${base}`;
}

export async function fetchCarThumb(
  make: string,
  model: string,
  size = 400,
): Promise<string | null> {
  const title = articleTitle(make, model);
  const key = `${title}@${size}`;
  if (cache.has(key)) return cache.get(key)!;
  if (inflight.has(key)) return inflight.get(key)!;

  const p = (async () => {
    try {
      const url = new URL("https://en.wikipedia.org/w/api.php");
      url.search = new URLSearchParams({
        action: "query",
        format: "json",
        prop: "pageimages",
        piprop: "thumbnail",
        pithumbsize: String(size),
        redirects: "1",
        titles: title,
        origin: "*",
      }).toString();

      const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (!res.ok) return null;
      const data = await res.json();
      const pages = data?.query?.pages ?? {};
      const first = Object.values(pages)[0] as
        | { thumbnail?: { source?: string } }
        | undefined;
      const src = first?.thumbnail?.source ?? null;
      cache.set(key, src);
      return src;
    } catch {
      cache.set(key, null);
      return null;
    } finally {
      inflight.delete(key);
    }
  })();

  inflight.set(key, p);
  return p;
}
