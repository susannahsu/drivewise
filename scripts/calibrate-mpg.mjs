/**
 * One-off calibration: pull real EPA combined fuel economy from fueleconomy.gov
 * (free, no key) for each seed model and print updated figures to paste into
 * lib/models/seed.ts. Run: `node scripts/calibrate-mpg.mjs`
 *
 * For each model we find the best-matching model name in the EPA menu (trying
 * recent years), fetch its trims, and average the combined MPG (comb08) — or,
 * for EVs, the combined kWh/100mi (combE).
 */
const BASE = "https://www.fueleconomy.gov/ws/rest";
const YEARS = [2026, 2025, 2024];

const SEED = [
  { id: "toyota-corolla-hybrid-2026", make: "Toyota", model: "Corolla Hybrid", pt: "hybrid" },
  { id: "toyota-prius-2026", make: "Toyota", model: "Prius", pt: "hybrid" },
  { id: "toyota-corolla-2026", make: "Toyota", model: "Corolla", pt: "gas" },
  { id: "honda-civic-2026", make: "Honda", model: "Civic", pt: "gas" },
  { id: "honda-civic-hybrid-2026", make: "Honda", model: "Civic Hybrid", pt: "hybrid" },
  { id: "mazda-3-2026", make: "Mazda", model: "Mazda3", pt: "gas" },
  { id: "hyundai-elantra-hybrid-2026", make: "Hyundai", model: "Elantra Hybrid", pt: "hybrid" },
  { id: "kia-k4-2026", make: "Kia", model: "K4", pt: "gas" },
  { id: "nissan-sentra-2026", make: "Nissan", model: "Sentra", pt: "gas" },
  { id: "subaru-impreza-2026", make: "Subaru", model: "Impreza", pt: "gas" },
  { id: "nissan-versa-2026", make: "Nissan", model: "Versa", pt: "gas" },
  { id: "toyota-camry-hybrid-2026", make: "Toyota", model: "Camry", pt: "hybrid" },
  { id: "honda-accord-hybrid-2026", make: "Honda", model: "Accord Hybrid", pt: "hybrid" },
  { id: "hyundai-sonata-2026", make: "Hyundai", model: "Sonata", pt: "gas" },
  { id: "toyota-corolla-cross-hybrid-2026", make: "Toyota", model: "Corolla Cross Hybrid", pt: "hybrid" },
  { id: "honda-hr-v-2026", make: "Honda", model: "HR-V", pt: "gas" },
  { id: "hyundai-venue-2026", make: "Hyundai", model: "Venue", pt: "gas" },
  { id: "kia-sportage-hybrid-2026", make: "Kia", model: "Sportage Hybrid", pt: "hybrid" },
  { id: "mazda-cx-30-2026", make: "Mazda", model: "CX-30", pt: "gas" },
  { id: "subaru-crosstrek-2026", make: "Subaru", model: "Crosstrek", pt: "gas" },
  { id: "toyota-rav4-hybrid-2026", make: "Toyota", model: "RAV4 Hybrid", pt: "hybrid" },
];

async function getJson(path) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`${res.status} ${path}`);
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

const asArray = (x) => (Array.isArray(x) ? x : x == null ? [] : [x]);

function bestModelMatch(items, target) {
  const t = target.toLowerCase();
  const names = items.map((i) => i.value);
  return (
    names.find((n) => n.toLowerCase() === t) ??
    names.find((n) => n.toLowerCase().includes(t)) ??
    names.find((n) => t.includes(n.toLowerCase().split(" ")[0]))
  );
}

async function calibrateOne(entry) {
  for (const year of YEARS) {
    let models;
    try {
      const menu = await getJson(`/vehicle/menu/model?year=${year}&make=${encodeURIComponent(entry.make)}`);
      models = asArray(menu?.menuItem);
    } catch {
      continue;
    }
    if (!models.length) continue;
    const matched = bestModelMatch(models, entry.model);
    if (!matched) continue;

    const opts = await getJson(
      `/vehicle/menu/options?year=${year}&make=${encodeURIComponent(entry.make)}&model=${encodeURIComponent(matched)}`,
    );
    const trims = asArray(opts?.menuItem).slice(0, 6);
    if (!trims.length) continue;

    const mpgs = [];
    const kwhs = [];
    for (const trim of trims) {
      try {
        const v = await getJson(`/vehicle/${trim.value}`);
        if (entry.pt === "ev") {
          if (v.combE && Number(v.combE) > 0) kwhs.push(Number(v.combE));
        } else if (v.comb08 && Number(v.comb08) > 0) {
          mpgs.push(Number(v.comb08));
        }
      } catch {
        /* skip trim */
      }
    }
    const avg = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : null);
    return {
      id: entry.id,
      matchedModel: matched,
      year,
      mpg: avg(mpgs) ? Math.round(avg(mpgs)) : null,
      kwhPer100mi: avg(kwhs) ? Math.round(avg(kwhs)) : null,
      trims: trims.length,
    };
  }
  return { id: entry.id, matchedModel: null, year: null, mpg: null, kwhPer100mi: null, trims: 0 };
}

const results = [];
for (const entry of SEED) {
  const r = await calibrateOne(entry);
  results.push(r);
  console.error(
    `${r.id.padEnd(36)} ${(r.matchedModel ?? "NO MATCH").padEnd(22)} ${r.year ?? "-"}  mpg=${r.mpg ?? "-"} kwh=${r.kwhPer100mi ?? "-"} (${r.trims} trims)`,
  );
}
console.log(JSON.stringify(results, null, 2));
