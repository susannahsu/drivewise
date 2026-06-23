/**
 * One-off calibration: build a 0–1 reliability score for each seed model from
 * real NHTSA recall counts (free, keyless) plus a brand reliability baseline
 * drawn from published 2026 rankings (Consumer Reports / RepairPal / iSeeCars).
 *
 * Why this blend: raw NHTSA *complaint* counts scale with sales volume (popular
 * cars look worse just for being common), so they're a poor standalone signal.
 * Recall counts are far less volume-biased, and a brand baseline captures the
 * well-documented reliability gap between makes. True per-model reliability
 * indices (CR, J.D. Power) are paywalled — this is an honest proxy.
 *
 * Run: `node scripts/calibrate-reliability.mjs`
 */
const RECALL_YEAR = 2024; // mature enough to have recalls, recent enough to matter

// Brand reliability baseline (0–1, higher = better), 2026 rankings, approximate.
const BRAND_BASELINE = {
  Toyota: 0.9,
  Honda: 0.82,
  Mazda: 0.8,
  Subaru: 0.78,
  Hyundai: 0.68,
  Kia: 0.66,
  Nissan: 0.6,
};

const SEED = [
  { id: "toyota-corolla-hybrid-2026", make: "Toyota", model: "Corolla" },
  { id: "toyota-corolla-2026", make: "Toyota", model: "Corolla" },
  { id: "honda-civic-2026", make: "Honda", model: "Civic" },
  { id: "honda-civic-hybrid-2026", make: "Honda", model: "Civic" },
  { id: "mazda-3-2026", make: "Mazda", model: "Mazda3" },
  { id: "hyundai-elantra-hybrid-2026", make: "Hyundai", model: "Elantra" },
  { id: "kia-k4-2026", make: "Kia", model: "Forte" }, // K4 replaced Forte; use Forte recalls
  { id: "nissan-sentra-2026", make: "Nissan", model: "Sentra" },
  { id: "subaru-impreza-2026", make: "Subaru", model: "Impreza" },
  { id: "nissan-versa-2026", make: "Nissan", model: "Versa" },
  { id: "toyota-camry-hybrid-2026", make: "Toyota", model: "Camry" },
  { id: "honda-accord-hybrid-2026", make: "Honda", model: "Accord" },
  { id: "hyundai-sonata-2026", make: "Hyundai", model: "Sonata" },
  { id: "toyota-corolla-cross-hybrid-2026", make: "Toyota", model: "Corolla Cross" },
  { id: "honda-hr-v-2026", make: "Honda", model: "HR-V" },
  { id: "hyundai-venue-2026", make: "Hyundai", model: "Venue" },
  { id: "kia-sportage-hybrid-2026", make: "Kia", model: "Sportage" },
  { id: "mazda-cx-30-2026", make: "Mazda", model: "CX-30" },
  { id: "subaru-crosstrek-2026", make: "Subaru", model: "Crosstrek" },
  { id: "toyota-rav4-hybrid-2026", make: "Toyota", model: "RAV4" },
];

async function recallCount(make, model, year) {
  try {
    const url = `https://api.nhtsa.gov/recalls/recallsByVehicle?make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}&modelYear=${year}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.Count ?? 0;
  } catch {
    return null;
  }
}

const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

const results = [];
for (const v of SEED) {
  const recalls = await recallCount(v.make, v.model, RECALL_YEAR);
  const base = BRAND_BASELINE[v.make] ?? 0.65;
  // Each recall trims the score a touch; floor so a recall-heavy year can't
  // crater an otherwise-reliable brand.
  const reliability = clamp(base - 0.02 * (recalls ?? 0), 0.4, 0.95);
  results.push({ id: v.id, recalls, reliability: Math.round(reliability * 100) / 100 });
  console.error(`${v.id.padEnd(36)} recalls(${RECALL_YEAR})=${recalls ?? "?"}  reliability=${reliability.toFixed(2)}`);
}
console.log(JSON.stringify(results, null, 2));
