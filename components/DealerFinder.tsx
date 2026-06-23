"use client";

import { useState } from "react";
import { findListings } from "@/app/(decisions)/_listings";
import type { Listing, ListingsResult } from "@/lib/data/listings";
import { marketplaceLinks } from "@/lib/marketplace-links";
import { money } from "@/lib/format";

/**
 * "Find dealer listings near you" for a chosen model. Hits the Auto.dev listings
 * API (live in-app comparison) when a key is configured, and always offers
 * curated marketplace search links as a fallback / browse-more.
 */
export function DealerFinder({
  make,
  model,
  state,
  maxPrice,
}: {
  make: string;
  model: string;
  state: string;
  maxPrice?: number;
}) {
  const [zip, setZip] = useState("");
  const [result, setResult] = useState<ListingsResult | null>(null);
  const [pending, setPending] = useState(false);

  async function run() {
    setPending(true);
    try {
      setResult(
        await findListings({
          make,
          model,
          state,
          zip: zip.trim() || undefined,
          maxPrice,
        }),
      );
    } finally {
      setPending(false);
    }
  }

  const locale = zip.trim() || state;
  const links = marketplaceLinks(make, model, locale);

  return (
    <section className="flex flex-col gap-3 rounded-xl border border-zinc-200 p-5 dark:border-zinc-800">
      <div>
        <h2 className="font-semibold">Compare dealer listings</h2>
        <p className="text-sm text-zinc-500">
          Find {make} {model} listings near you to compare real prices.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-600 dark:text-zinc-400">
            ZIP (optional)
          </span>
          <input
            value={zip}
            onChange={(e) => setZip(e.target.value)}
            inputMode="numeric"
            placeholder={state}
            className="w-28 rounded border border-zinc-300 bg-transparent px-2 py-1.5 dark:border-zinc-700"
          />
        </label>
        <button
          onClick={run}
          disabled={pending}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {pending ? "Searching dealers…" : "Find listings near me"}
        </button>
      </div>

      {result?.ok && result.listings.length > 0 && (
        <ListingsTable listings={result.listings} />
      )}

      {result?.ok && result.listings.length === 0 && (
        <p className="text-sm text-zinc-500">
          No live listings matched — try a wider search on a marketplace below.
        </p>
      )}

      {result && !result.ok && result.reason === "no_key" && (
        <p className="rounded-lg bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-400">
          Live in-app comparison needs a free Auto.dev API key
          (<code>AUTO_DEV_API_KEY</code>, 1,000 lookups/mo). Until then, use the
          marketplace links below.
        </p>
      )}

      {result && !result.ok && result.reason === "error" && (
        <p className="text-sm text-zinc-500">
          Couldn&apos;t reach the listings service — try a marketplace below.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-zinc-500">
          {result?.ok && result.listings.length > 0 ? "Browse more:" : "Search on:"}
        </span>
        {links.map((l) => (
          <a
            key={l.label}
            href={l.url}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-zinc-200 px-3 py-1 hover:border-emerald-400 dark:border-zinc-800"
          >
            {l.label} ↗
          </a>
        ))}
      </div>
    </section>
  );
}

function ListingsTable({ listings }: { listings: Listing[] }) {
  const cheapest = Math.min(...listings.map((l) => l.price ?? Infinity));
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-200 text-left text-zinc-500 dark:border-zinc-800">
            <th className="py-2 pr-2">Year</th>
            <th className="py-2 pr-2 text-right">Price</th>
            <th className="py-2 pr-2 text-right">Miles</th>
            <th className="py-2 pr-2">Dealer</th>
            <th className="py-2"></th>
          </tr>
        </thead>
        <tbody>
          {listings.map((l, i) => (
            <tr
              key={l.vin ?? i}
              className={`border-b border-zinc-100 dark:border-zinc-900 ${
                l.price === cheapest ? "bg-emerald-500/5" : ""
              }`}
            >
              <td className="py-2 pr-2">{l.year ?? "—"}</td>
              <td className="py-2 pr-2 text-right font-semibold tabular-nums">
                {l.price != null ? money(l.price) : "—"}
                {l.price === cheapest && (
                  <span className="ml-1 text-xs font-normal text-emerald-600">
                    best
                  </span>
                )}
              </td>
              <td className="py-2 pr-2 text-right tabular-nums">
                {l.miles != null ? `${Math.round(l.miles / 1000)}k` : "—"}
              </td>
              <td className="py-2 pr-2 text-zinc-500">
                {l.dealer ?? "—"}
                {l.city ? `, ${l.city}` : ""}
              </td>
              <td className="py-2 text-right">
                <a
                  href={l.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-600 hover:underline"
                >
                  View ↗
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
