"use server";

import {
  fetchListings,
  type ListingsQuery,
  type ListingsResult,
} from "@/lib/data/listings";

/**
 * Shared server action: search live dealer listings for a model. The `_` prefix
 * keeps this file out of routing; called from the acquisition view and the
 * guided-flow dashboard.
 */
export async function findListings(
  query: ListingsQuery,
): Promise<ListingsResult> {
  return fetchListings(query);
}
