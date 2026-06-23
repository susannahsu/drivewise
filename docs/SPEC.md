# DriveWise — Product & Technical Spec

_Last updated: 2026-06-23_

## 0. One-paragraph summary

DriveWise is a Next.js web app that helps a household make the **lowest-regret,
lowest-cost car decision** using live data. The core is a **Total Cost of
Ownership (TCO) engine**. Every user-facing "decision" (powertrain, own-vs-Uber,
model pick, lease-vs-buy) is a comparison of TCO scenarios under that user's real
driving profile. We pull current electricity, gasoline, interest-rate, and
vehicle data, cache it, and run the math transparently — every number is
explainable and every assumption is editable.

Design principles:

- **One engine, many questions.** Don't build four calculators; build one TCO
  model and four views into it.
- **Live where it matters, sane defaults everywhere else.** Prices that move
  (gas, electricity, loan rates) are fetched live. Slow-moving stuff
  (depreciation curves, maintenance schedules) ships as editable defaults.
- **Show your work.** Every recommendation comes with a cost breakdown, the
  break-even point, and the assumptions used. No black boxes.
- **The null answer is valid.** "Keep your current car" and "just Uber" must be
  reachable conclusions.

---

## 1. The shared model

### 1.1 Driving Profile (user input, saved per household)

```
DrivingProfile {
  state: USState                 // drives electricity & gas prices
  homeCharging: boolean          // FALSE for us → public/DC charging assumptions
  annualMiles: number            // derived from routes below, or entered directly
  ownershipYears: number         // how long you plan to keep it (huge lever)
  routes: Route[]                // for the own-vs-Uber comparison
  parkingMonthly?: number
  tollsMonthly?: number
}

Route {
  label: string                  // "commute to office"
  oneWayMiles: number
  tripsPerDay: number
  daysPerWeek: number
  typicalDepartTime: TimeOfDay   // for Uber surge modeling
  typicalReturnTime: TimeOfDay
}
```

### 1.2 TCO engine (the heart)

For any vehicle option over the ownership horizon, total cost =

```
TCO = depreciation (or lease payments)
    + financing interest
    + energy (gasoline OR electricity OR both for hybrid)
    + insurance
    + maintenance & repairs
    + registration / taxes / fees
    + parking + tolls
    − resale value at end of horizon
    + opportunity cost of capital tied up (down payment / cash purchase)
```

Output is both a **total** and a **per-mile** and **per-month** figure, plus a
year-by-year cash-flow series (so we can chart break-even).

Each line item is a small, independently testable function with a documented
data source and a default. See `docs/DATA_SOURCES.md`.

---

## 2. User stories

### US-1 — Hybrid vs Gas vs Electric

**Goal:** Given the user's state, driving profile, and *no home charging*,
recommend the cheapest powertrain over the ownership horizon.

- Pull state-level **residential electricity price** and **gasoline price**.
- Because `homeCharging = false`, EV energy cost uses **public L2 + DC fast
  charging** blended rates (much higher than residential — this often flips the
  EV math, and we surface that honestly).
- Compute energy cost/year for representative vehicles in each class (e.g. a
  gas Civic vs hybrid Civic vs an EV) using EPA MPG / kWh-per-100-mi from
  fueleconomy.gov.
- Output: cost per year per powertrain **and the break-even mileage/years** for
  the hybrid premium and the EV premium. ("A hybrid pays for itself after ~X
  miles; without home charging, the EV never catches the hybrid at your mileage"
  — or whatever the data says.)
- **Shallow MVP:** compare three hand-picked representative vehicles.
  **Later:** let the user pick the actual models they're considering.

### US-2 — Own a car vs Uber/Lyft

**Goal:** Is it cheaper to own (US-1's winner) or to rideshare your real routes?

- Compute monthly rideshare cost from `routes`: distance + time + base fare +
  **surge multipliers** keyed to `typicalDepartTime`/`typicalReturnTime`.
- ⚠️ Uber/Lyft no longer expose a public price-estimate API. **MVP approach:** a
  transparent fare model (base + per-mile + per-minute + surge curve) with
  city/state-tunable constants the user can calibrate from one real quote. See
  data-sources doc for why and the fallback plan.
- Compare rideshare monthly cost vs owned-car monthly TCO (incl. the days the
  car sits idle — ownership cost is fixed, rideshare scales with use). The
  crossover is usually "below N trips/week, Uber wins."
- Output: monthly cost each way, the trips/week break-even, and a note on
  non-cost factors (flexibility, no parking, no maintenance hassle).

### US-3 — Which brand & model

**Goal:** Rank candidate models by the user's chosen objective.

- Objectives (user picks one, or weights several):
  `lowest_tco`, `best_reliability`, `slowest_depreciation`, `lowest_emissions`,
  `best_resale_ratio`.
- Pull/maintain per-model data: MSRP & typical transaction price, EPA
  efficiency, reliability/recall signal (NHTSA), depreciation curve, emissions.
- **Multi-objective:** normalize each metric to 0–1, apply user weights, rank;
  optionally show the **Pareto frontier** (e.g. "these 3 cars are all
  non-dominated — pick by taste").
- **Shallow MVP:** a curated seed list of ~15–25 popular models with hand-loaded
  data. **Later:** live listings via Marketcheck and a broader catalog.

### US-4 — Lease vs Buy New vs Buy Used

**Goal:** Cheapest acquisition strategy for a chosen model over the horizon.

- **Lease:** monthly payment from cap cost, residual, money factor (from current
  rates), term; no resale upside.
- **Buy new:** finance at current auto-loan APR (FRED), eat first-year
  depreciation (steepest), keep resale value.
- **Buy used:** lower price + someone else ate the depreciation cliff, but
  higher maintenance/repair risk and possibly higher APR.
- Key lever is `ownershipYears`: short horizon favors lease, long horizon favors
  buy-and-hold used. Output the three TCOs + the horizon at which the ranking
  flips.

---

## 3. Additional user stories worth having (my suggestions)

These came out of the brainstorm — ranked by bang-for-buck:

1. **TCO breakdown & "show your work" view** _(must-have, it's the engine made
   visible)_ — stacked cost bars for any option.
2. **Break-even / payback charts** _(high value, cheap)_ — the single most
   persuasive output: "the hybrid premium pays off in year 6."
3. **Sensitivity / scenario sliders** _(high value)_ — "what if gas hits $6?",
   "what if we drive 30% more?", "what if we sell after 3 years not 7?". Shows
   how *robust* the recommendation is, not just the point estimate.
4. **"Don't buy yet / keep current car"** _(high value, easy)_ — compare any new
   option against the marginal cost of keeping what you have.
5. ~~Two-car household optimization~~ — **dropped: single-car decision.**
6. **Financing optimizer** — down payment vs APR vs term, including the
   opportunity cost of cash (what that money earns elsewhere).
7. **Carbon objective** — let "minimize CO₂/year" be a selectable goal or a
   constraint ("cheapest option under X tons/year").
8. **Apartment-charging reality check** — since you have no home charging, a
   dedicated view modeling public-charging cost *and time* (waiting at a charger
   has a real hourly value).
9. **Is-this-listing-a-good-deal** — compare a specific listing's price to
   market (needs Marketcheck; later phase).
10. **Insurance estimate by model & state** — big TCO line item; hard to get
    free/live, so MVP uses editable defaults (see data-sources doc).

---

## 4. Architecture

```
app/
  page.tsx                      // landing + profile setup
  (decisions)/
    powertrain/page.tsx         // US-1
    own-vs-rideshare/page.tsx   // US-2
    model-picker/page.tsx       // US-3
    acquisition/page.tsx        // US-4
  api/
    energy-prices/route.ts      // EIA: electricity + gas by state
    loan-rates/route.ts         // FRED: auto loan APR
    vehicles/route.ts           // fueleconomy.gov + NHTSA
lib/
  tco/                          // the engine — pure functions, well-tested
    depreciation.ts
    energy.ts                   // gas / electric / hybrid energy cost
    financing.ts                // loan, lease money-factor
    insurance.ts                // defaults + overrides
    maintenance.ts
    index.ts                    // composes a full TCO
  data/
    eia.ts  fred.ts  fueleconomy.ts  nhtsa.ts  rideshare-model.ts
    cache.ts                    // TTL cache so we don't hammer APIs
  models/seed.ts                // curated model catalog for MVP
  schema.ts                     // Zod schemas (profile, vehicle, results)
docs/
  SPEC.md  DATA_SOURCES.md
```

- **TCO engine = pure functions**, no I/O. Data fetching lives in `lib/data/*`
  and is injected in. This makes the math unit-testable and the data sources
  swappable.
- **Caching:** live data is fetched server-side and cached with a TTL (energy
  prices daily/weekly, loan rates weekly). Never call external APIs from the
  client.
- **State:** start with localStorage for the household profile (no auth needed
  for MVP). Add accounts only if you want to save/share scenarios.

---

## 5. Roadmap (MVP = all 4 stories, shallow)

**Phase 0 — Scaffold**
- Next.js + TS + Tailwind + Zod + Recharts. CI lint/typecheck/test. `.env` for
  API keys (EIA, FRED). This spec lives in repo.

**Phase 1 — TCO engine + data layer**
- Implement `lib/tco/*` pure functions with sane defaults and unit tests.
- Wire EIA (energy), FRED (rates), fueleconomy.gov + NHTSA (vehicles) with
  caching. Seed a ~20-model catalog by hand.

**Phase 2 — The four decision views (shallow)**
- US-1 powertrain, US-2 own-vs-Uber (modeled fares), US-3 model picker
  (weighted ranking over seed list), US-4 acquisition. Each renders a cost
  breakdown + break-even.

**Phase 3 — Persuasion layer**
- Break-even charts, sensitivity sliders, "show your work" breakdowns,
  "don't buy yet" comparison.

**Phase 4 — Depth (pick based on what you actually need)**
- Live listings (Marketcheck), broader catalog, two-car household optimizer,
  carbon objective, account-based saved scenarios.

---

## 6. Open questions / decisions to revisit

- **Rideshare fares:** RideGuru (API on request) is the live option; otherwise
  lock in the modeled-fare + one-calibration-quote approach. ✅ researched, see
  data-sources doc.
- **Insurance & depreciation:** ✅ resolved — Apify insurance estimator +
  Auto.dev free listings (depreciation) + CarEdge defaults. Marketcheck dropped
  from MVP (Auto.dev free tier covers listings). See data-sources doc.
- **Catalog:** ✅ resolved — seed shortlist of 20 best-value models in
  [`CAR_SHORTLIST.md`](CAR_SHORTLIST.md). Still worth personalizing to body
  style / budget / used-vs-new (see that doc's to-do).
- **Two cars or one?** ✅ resolved — **one car.** US-5 (two-car household
  optimizer) is dropped from scope; US-3 is a single-car pick.
