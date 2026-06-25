import type { Vehicle } from "@/lib/schema";

/**
 * Outbound links for a specific car. We deliberately use a Google query rather
 * than hardcoded manufacturer URLs — model page paths rot constantly, whereas a
 * search reliably surfaces the official build-&-price page, reviews, and specs.
 * Pure string-building, safe to import on the client.
 */
export function researchUrl(v: Vehicle): string {
  const q = encodeURIComponent(`${v.year} ${v.make} ${v.model} review specs price`);
  return `https://www.google.com/search?q=${q}`;
}

/** A used-listings search for the model, scoped near a location (state/zip). */
export function shopUsedUrl(v: Vehicle, locale: string): string {
  const q = encodeURIComponent(
    `used ${v.make} ${v.model} for sale near ${locale}`,
  );
  return `https://www.google.com/search?q=${q}`;
}
