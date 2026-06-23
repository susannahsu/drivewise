/**
 * Curated marketplace search deep-links — the no-key fallback (and "browse more"
 * companion) for the dealer finder. Google always resolves; the others are
 * best-effort. Pure string-building, safe to import on the client.
 */
export function marketplaceLinks(
  make: string,
  model: string,
  locale: string,
): { label: string; url: string }[] {
  const q = encodeURIComponent(`used ${make} ${model} for sale near ${locale}`);
  const mk = make.toLowerCase();
  const md = model.toLowerCase().replace(/\s+/g, "-");
  const loc = encodeURIComponent(locale);
  return [
    { label: "Google", url: `https://www.google.com/search?q=${q}` },
    {
      label: "Autotrader",
      url: `https://www.autotrader.com/cars-for-sale/all-cars/${mk}/${md}?zip=${loc}&searchRadius=50`,
    },
    {
      label: "Cars.com",
      url: `https://www.cars.com/shopping/results/?stock_type=used&makes[]=${mk}&models[]=${mk}-${md}&zip=${loc}&maximum_distance=50`,
    },
  ];
}
