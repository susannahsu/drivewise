# DriveWise — Data Sources & Gotchas

The whole value prop is "live, real numbers." This doc tracks where each number
comes from, how fresh it is, and the catch. **Verify each of these is still live
and on its current terms before building against it** — APIs change.

Legend: ✅ free + good API · 🟡 free but limited/awkward · 🔴 no good free API (model or default it)

## Energy prices

### Electricity — ✅ EIA Open Data API v2
- U.S. Energy Information Administration. Free, needs an API key.
- Provides **residential electricity price by state** (cents/kWh), updated
  monthly. Good enough — retail electricity moves slowly.
- ⚠️ We have **no home charging**, so residential rate is *not* the right number
  for EV charging. Use it only as a floor; real EV cost comes from public
  charging (below).
- Key: free signup at the EIA site.

### Gasoline — 🟡 EIA (regional/weekly) + per-state gaps
- EIA gives weekly retail gasoline by PADD region and for a subset of states/
  cities, not clean daily-by-state for all 50.
- Gotcha: AAA shows nice daily state averages but has **no free public API**;
  GasBuddy's API is commercial. So: use EIA for what it covers, fall back to a
  regional estimate + user override field. Let the user type today's local price
  — that's the most accurate input anyway.

## Interest / lease rates

### Auto-loan APR — ✅ FRED API
- Federal Reserve (St. Louis Fed) FRED. Free, needs an API key.
- Series for finance-rate on consumer auto loans; use as the default APR, let
  user override with their actual quote.
- Lease **money factor** isn't published live — derive an approximation from the
  APR (money factor ≈ APR / 2400) and let the user override.

## Vehicle data

### Efficiency, MPG, kWh/100mi — ✅ fueleconomy.gov web services
- U.S. DOE/EPA. Free, **no key**. Per-model MPG, kWh/100mi, annual fuel cost,
  emissions. This is the backbone of the energy + emissions math.

### Recalls, complaints, safety — ✅ NHTSA APIs
- vPIC (VIN/manufacturer decode), recalls, complaints, safety ratings. Free,
  no key. Use recall/complaint counts as a **reliability proxy** (real
  reliability data like Consumer Reports / J.D. Power is paywalled).

## The hard ones (no good free live source)

### Rideshare fares (US-2) — 🔴 model it
- Uber and Lyft **deprecated their public price-estimate APIs**; remaining
  access is partner-gated. Don't build around scraping (ToS + fragile).
- **Plan:** a transparent fare model — `base + perMile*miles + perMin*minutes`,
  times a **surge multiplier** that's a function of time-of-day (rush-hour
  curve). Seed constants per metro from published city rate cards; let the user
  paste **one real quote** for their route to calibrate the constants. Honest,
  stable, and good enough for a buy-vs-rideshare crossover.

### Depreciation / resale value (US-3, US-4) — 🔴 default + later upgrade
- KBB/Edmunds residual data is paywalled. **MVP:** ship segment-based
  depreciation curves (e.g. luxury depreciates faster, Toyotas hold value),
  editable by the user. **Later:** Marketcheck (has a free tier for used-listing
  data) to estimate real resale by model/year/mileage.

### Insurance (TCO line item) — 🔴 default + override
- No free live quote API worth using. **MVP:** default annual premium by vehicle
  segment + state factor, fully editable. Encourage the user to drop in their
  real quote — it's the most accurate path anyway.

### Used-car listings & "good deal?" (later) — 🟡 Marketcheck
- Marketcheck has a free developer tier for active listings (price, mileage,
  location). Good for the "is this listing below market?" feature in a later
  phase. Watch rate limits.

## Caching & freshness policy

| Data            | Source          | Refresh        |
|-----------------|-----------------|----------------|
| Electricity     | EIA             | monthly        |
| Gasoline        | EIA + override  | weekly / live  |
| Auto-loan APR   | FRED            | weekly         |
| Vehicle specs   | fueleconomy.gov | on demand, cache long |
| Recalls/safety  | NHTSA           | on demand, cache long |
| Rideshare       | model + calib.  | user-calibrated |

Fetch server-side, cache with TTL (`lib/data/cache.ts`), never call external
APIs from the browser. Always degrade gracefully to a default + user-override
field when a source is down or doesn't cover the user's state.

---

# Substitute / surrogate research (2026-06-23)

The original "🔴 no good free source" calls were too pessimistic. After
researching, **every gap now has a usable surrogate**, and one finding —
**Auto.dev's free tier** — single-handedly solves listings *and* opens a path to
depreciation for free. Summary of the recommended stack per gap:

| Gap | Recommended (free/cheap) surrogate | Backup | Notes |
|-----|-----------------------------------|--------|-------|
| **Gas by state** | EIA (9 states + 10 cities + PADD regions) for covered areas; **CollectAPI** or **OilPriceAPI** (freemium) for full 50-state | User-typed local price (always most accurate) | EIA does *not* cover all 50 states weekly — confirmed. See below. |
| **Rideshare fares** | **RideGuru** (Uber/Lyft/taxi estimates; API on request) | Modeled fare + 1 real-quote calibration | Uber/Lyft public estimate APIs remain partner-gated. |
| **Depreciation / resale** | **Auto.dev** free listings → derive resale from price vs age/mileage; **CarEdge** curves (300+ models) as defaults | **Brego** (96-mo depreciation, free trial), **VinAudit** Market Value (cheap) | KBB/Edmunds still paywalled. |
| **Insurance** | **Apify Auto Insurance Rates Estimator** (by make/model/year + state, NHTSA-based) | MoneyGeek/Bankrate state+model average tables + user override | No free *quote* API, but this surrogate is good enough for a TCO line item. |
| **Used listings / "good deal?"** | **Auto.dev free tier — 1,000 calls/mo**, listings + VIN decode + photos | Marketcheck (paid) only if you outgrow it | **The big unlock — replaces Marketcheck for free in MVP.** |
| **Reliability** | **NHTSA** complaints/recalls API (free) + **The Weekly Driver** free engine-reliability DB (4,553 engines, 1.5M complaints, engine-level) | RepairPal / Car IQ Report (reference) | Consumer Reports / J.D. Power stay paywalled; these are solid free proxies. |

### Detail by gap

**Gas by state.** EIA confirmed coverage: retail gasoline (incl. taxes) for **10
cities, 9 states, and all PADD regions**, weekly, via the API — *not* all 50
states. For uncovered states either map the state → its PADD region (cheap, OK)
or use a freemium 50-state source:
- [CollectAPI Gas Prices](https://collectapi.com/api/gasPrice/gas-prices-api) — US/Canada/Europe, free Basic plan on RapidAPI.
- [OilPriceAPI gas prices by state](https://www.oilpriceapi.com/gasoline-prices) — free tier.
- [GlobalPetrolPrices.com API](https://www.globalpetrolprices.com/data_access.php) — state-level US gas/diesel, weekly (paid, cheap).
- [TomTom Fuel Prices API](https://developer.tomtom.com/fuel-prices-api/documentation/product-information/introduction) — station-level, 10-min refresh (free dev tier).
- [Barchart Fuel Prices API](https://www.barchart.com/ondemand/api/getFuelPrices) — filter by state/county/zip.

**Rideshare.** [RideGuru](https://ride.guru/) aggregates Uber/Lyft/taxi/limo fare
estimates and grants API access on request (research-friendly).
[FareEstimate.com](https://fareestimate.com/) reconstructs fares from receipts +
formulas when APIs are unavailable — same approach we'll use as the modeled
fallback. Plan stands: model the fare, let the user paste one real quote to
calibrate.

**Depreciation.** [Auto.dev](https://www.auto.dev/listings) free Starter tier
(1,000 calls/mo) returns active listings with price/year/mileage — regress those
to get *real* market resale by model. [CarEdge depreciation](https://caredge.com/depreciation)
publishes 10-year resale for 300+ models (great default source).
[Brego API](https://brego.io/products/api) offers up to 96 months of depreciation
on a free trial; [VinAudit Market Value](https://www.vinaudit.com/vehicle-market-value-api)
is a cheap paid endpoint.

**Insurance.** [Apify Auto Insurance Rates Estimator](https://apify.com/copious_atoll/insurance-rates/api)
estimates average premiums by make/model/year + state using NHTSA vehicle
classification + published industry averages — the best live surrogate found.
Back it with [MoneyGeek's rates-by-car-model tables](https://www.moneygeek.com/insurance/auto/by-vehicle/)
as defaults + a user-override field.

**Listings.** [Auto.dev Vehicle Listings API](https://www.auto.dev/listings):
Starter = **1,000 free calls/month** (listings + VIN decode + photos), then
$0.002/call. Growth ($299/mo) adds specs, recalls, **built-in TCO**, payments,
and interest rates if we ever want to outsource more of the math. This is the
recommended replacement for Marketcheck in the MVP.

**Reliability.** Combine the free [NHTSA APIs](https://www.nhtsa.gov/nhtsa-datasets-and-apis)
(recalls + complaints + safety ratings) with
[The Weekly Driver engine-reliability database](https://theweeklydriver.com/2026/04/twd-engine-reliability-database-launch-2026/)
(engine-level ratings from 1.5M NHTSA complaints — uniquely useful for comparing
hybrid vs gas powertrains *within* the same model).
[RepairPal](https://repairpal.com/reliability) and [Car IQ Report](https://cariqreport.com/)
are good cross-reference points.

### Net effect on the build

- Marketcheck drops out of the MVP entirely (Auto.dev free tier covers it).
- Insurance and reliability move from 🔴 to 🟡 — real surrogates exist.
- Only genuinely irreducible gap: precise live rideshare fares, which we were
  always going to model + calibrate anyway.
