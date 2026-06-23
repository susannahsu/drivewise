import { z } from "zod";

/**
 * Live dealer listings via the Auto.dev Listings API (free tier: 1,000 calls/mo).
 * Auth is an `Authorization: Bearer` header; we query by make/model and either a
 * ZIP + radius or a state. Without a key we return { ok:false, reason:"no_key" }
 * so the UI can fall back to curated marketplace search links. Server-side only.
 *
 * Field names are parsed defensively — the API nests under vehicle/retailListing
 * and we tolerate missing fields rather than failing the whole request.
 */
const AUTO_DEV_BASE = "https://api.auto.dev/listings";

export interface Listing {
  vin?: string;
  year?: number;
  make: string;
  model: string;
  price?: number;
  miles?: number;
  city?: string;
  state?: string;
  dealer?: string;
  url: string;
  photoUrl?: string;
}

export interface ListingsQuery {
  make: string;
  model: string;
  state?: string;
  zip?: string;
  radiusMiles?: number;
  maxPrice?: number;
}

export type ListingsResult =
  | { ok: true; listings: Listing[] }
  | { ok: false; reason: "no_key" | "error" };

const RawListing = z
  .object({
    vehicle: z
      .object({
        vin: z.string().optional(),
        year: z.coerce.number().optional(),
        make: z.string().optional(),
        model: z.string().optional(),
      })
      .passthrough()
      .optional(),
    retailListing: z
      .object({
        price: z.coerce.number().optional(),
        miles: z.coerce.number().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        dealerName: z.string().optional(),
        vdpUrl: z.string().optional(),
        primaryPhotoUrl: z.string().optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();

const RawResponse = z.object({ data: z.array(RawListing).default([]) });

export async function fetchListings(
  query: ListingsQuery,
): Promise<ListingsResult> {
  const key = process.env.AUTO_DEV_API_KEY;
  if (!key) return { ok: false, reason: "no_key" };

  try {
    const url = new URL(AUTO_DEV_BASE);
    url.searchParams.set("vehicle.make", query.make);
    url.searchParams.set("vehicle.model", query.model);
    if (query.zip) {
      url.searchParams.set("zip", query.zip);
      url.searchParams.set("distance", String(query.radiusMiles ?? 50));
    } else if (query.state) {
      url.searchParams.set("retailListing.state", query.state);
    }
    if (query.maxPrice) {
      url.searchParams.set("retailListing.price", `0-${query.maxPrice}`);
    }
    url.searchParams.set("sort", "price");
    url.searchParams.set("limit", "15");

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) return { ok: false, reason: "error" };

    const parsed = RawResponse.safeParse(await res.json());
    if (!parsed.success) return { ok: false, reason: "error" };

    const listings: Listing[] = parsed.data.data.map((row) => {
      const v = row.vehicle ?? {};
      const r = row.retailListing ?? {};
      const vin = v.vin;
      return {
        vin,
        year: v.year,
        make: v.make ?? query.make,
        model: v.model ?? query.model,
        price: r.price,
        miles: r.miles,
        city: r.city,
        state: r.state,
        dealer: r.dealerName,
        url:
          r.vdpUrl ??
          (vin
            ? `https://www.google.com/search?q=${encodeURIComponent(`${v.year ?? ""} ${query.make} ${query.model} ${vin}`)}`
            : "#"),
        photoUrl: r.primaryPhotoUrl,
      };
    });

    return { ok: true, listings };
  } catch {
    return { ok: false, reason: "error" };
  }
}
