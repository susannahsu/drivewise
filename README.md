# DriveWise 🚗💸

**A live-data decision tool for buying a car without overspending.** DriveWise
pulls current prices — electricity and gas by state, auto-loan rates, real EPA
fuel economy, depreciation data — and tells you the *mathematically cheapest*
way to meet your driving needs, not the prettiest car or the one with the best
ad budget.

Built as a real tool for a real decision (my household actually needed to buy a
car), then polished into a portfolio project.

> **Live data, no vibes.** Gas, electricity, and loan rates are fetched live;
> MPG is real EPA data; resale is calibrated to the iSeeCars 2026 study. Every
> recommendation shows its work — a full cost breakdown, a break-even chart, and
> the assumptions used.

<!-- Add screenshots to docs/screenshots/ and they'll render here -->
<!-- ![Guided recommendation](docs/screenshots/guide-dashboard.png) -->

## What it does

A **guided flow** (`/guide`) asks seven plain-English questions and returns a
single synthesized recommendation — *which* car and *how to pay for it* — backed
by a four-module board that shows the decision process. Each module is also a
standalone tool you can open directly:

| Decision | Question | What drives it |
|----------|----------|----------------|
| **Powertrain** | Hybrid, gas, or electric? | Live gas/electricity for your state, your mileage, and whether you can charge at home |
| **Own vs Uber** | Buy, lease, or just rideshare? | Your real commute with rush-hour surge vs the fixed cost of owning/leasing |
| **Which model** | Best car for *you*? | A 20-car best-value shortlist ranked by your priority — lowest cost, efficiency, resale, or reliability |
| **How to pay** | Lease, buy new, or buy used? | Depreciation curves, live loan rates, and how long you'll keep it |

On top of that: total cost of ownership over your real horizon, **what-if
sliders** (gas price, mileage, years) that re-rank everything instantly,
**break-even charts**, a "keep your current car" comparison, and a **dealer
listings** lookup that pulls live local inventory for a chosen model.

## The core idea: one engine, many questions

Every question above is secretly the same question — *"what's the total cost of
meeting our driving needs under option X?"* So the heart of DriveWise is a single
**Total Cost of Ownership (TCO) engine**: a set of pure, unit-tested functions
that compose depreciation, financing, energy, insurance, maintenance, fees, and
opportunity cost into a year-by-year cash-flow series. Every view is just a
different comparison built on that one engine.

## Engineering highlights

A few decisions a reviewer might find interesting:

- **Pure, testable core.** The TCO engine ([`lib/tco/`](lib/tco)) does no I/O —
  live prices are fetched separately and injected in. That keeps the math
  fully unit-testable (64 tests) and the data sources swappable. The cumulative
  cost series is the single source of truth, so the headline number and the
  break-even chart can never disagree.
- **Instant sensitivity, server-fetched prices.** Because the engine is pure, it
  runs in the browser: each page fetches live prices once via a server action,
  then recomputes results client-side as the sliders move — no round-trips per
  drag.
- **Resilient data layer.** Every price source ([`lib/data/`](lib/data)) fetches
  independently, validates responses with Zod, caches with a TTL, and **degrades
  to a documented fallback** on any failure — a flaky API can never break a
  recommendation. Each price also reports whether it came back live or estimated,
  surfaced as a badge in the UI.
- **Calibrated against real data, not made up.** A [calibration script](scripts/calibrate-mpg.mjs)
  pulls real EPA combined MPG for every seed model from fueleconomy.gov; resale
  ratios are anchored to the iSeeCars 2026 depreciation study. No fabricated
  precision.
- **Dependency-free SVG charts.** The break-even / crossover charts are a small
  hand-built SVG component ([`components/BreakEvenChart.tsx`](components/BreakEvenChart.tsx))
  rather than a charting library — full control, zero bundle cost, no React-19
  peer-dep friction.
- **Honest about its limits.** Rideshare fares are modeled (Uber/Lyft killed
  their public APIs) and calibratable from one real quote; estimates are labelled
  as such throughout.

## Live data sources

All free; the app runs fully on offline fallbacks if you skip the keys.

| Source | Used for | Key |
|--------|----------|-----|
| [EIA](https://www.eia.gov/opendata/) | Electricity (per state) + gas (per state / PADD region) | `EIA_API_KEY` |
| [FRED](https://fred.stlouisfed.org/docs/api/fred/) | Current auto-loan APR | `FRED_API_KEY` |
| [fueleconomy.gov](https://www.fueleconomy.gov/feg/ws/) | EPA combined MPG (calibration) | none |
| [iSeeCars 2026](https://www.iseecars.com/cars-that-hold-their-value-study) | 5-year resale / depreciation | none |
| [NHTSA](https://www.nhtsa.gov/nhtsa-datasets-and-apis) | Reliability signal (recalls/complaints) | none |
| [Auto.dev](https://www.auto.dev/) | Live dealer listings for a model | `AUTO_DEV_API_KEY` |
| [Wikipedia](https://www.mediawiki.org/wiki/API:Page_info_in_search_results) | Real car photos | none |

See [`docs/DATA_SOURCES.md`](docs/DATA_SOURCES.md) for the full source list, the
gotchas, and the researched free substitutes for paywalled data.

## Tech stack

**Next.js 16** (App Router, Server Actions) · **React 19** · **TypeScript** ·
**Tailwind CSS v4** · **Zod** (boundary validation) · **Vitest** · deploys on
**Vercel**.

## Running it locally

Requires **Node 22** (pinned via `.nvmrc`).

```bash
nvm use            # → Node 22
npm install
npm run dev        # http://localhost:3000
```

Optional — copy `.env.example` to `.env.local` and add any of the free keys
above to switch from estimated to live prices:

```bash
cp .env.example .env.local   # then paste your EIA / FRED / Auto.dev keys
```

Other scripts: `npm run build`, `npm run lint`, `npm test`.

## Tests

```bash
npm test           # 64 unit tests (vitest)
```

Coverage focuses on the parts that matter: every TCO line item, the rideshare
fare model, the "keep current car" math, and the end-to-end recommendation
engine (powertrain coupling, budget/body filtering, rideshare crossover).

## Project structure

```
app/
  guide/                  # the 7-question guided flow + decision dashboard
  (decisions)/            # the four standalone tools (shared tab nav)
    powertrain/  own-vs-rideshare/  model-picker/  acquisition/
lib/
  tco/                    # pure TCO engine — one module per cost line
  data/                   # live-price fetchers (EIA, FRED, Auto.dev) + fallbacks
  models/                 # the calibrated 20-car seed catalog
  recommend.ts            # composes all four modules into one recommendation
components/               # charts, car images, shared inputs
docs/                     # spec, data-source research, car shortlist
scripts/                  # one-off data calibration (EPA MPG)
```

## Notes

This is a personal project and a decision aid, not financial advice. Figures are
best-effort estimates; insurance, depreciation, and rideshare fares are modeled
and meant to be overridden with your own quotes. Prices are cached and reflect
the most recent data each source publishes.
