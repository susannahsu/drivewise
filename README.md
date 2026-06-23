# DriveWise 🚗💸

A decision tool for people who hate spending money they don't have to.

DriveWise pulls the most recent real-world prices (electricity, gas, interest
rates, vehicle data) and tells you the **mathematically cheapest** way to meet
your driving needs — not the prettiest car, the *optimal* one.

It answers questions like:

1. **Hybrid, gas, or electric?** Given today's electricity & gas prices in *your
   state* and how you actually drive.
2. **Buy a car at all, or just Uber/Lyft?** Given your real commute routes,
   frequency, and the times of day you travel (surge pricing matters).
3. **Which brand & model?** Optimized for *your* objective — lowest total cost,
   best reliability, slowest depreciation, lowest emissions, or a weighted mix.
4. **Lease, buy new, or buy used?** Given depreciation curves, current loan
   rates, and how long you plan to keep it.

Plus things you didn't ask for but probably want: total cost of ownership over
your real ownership horizon, break-even analysis, sensitivity to gas-price
shocks, and a "honestly, don't buy anything yet" answer when that's the right
call.

> Status: **Phase 0 complete** — Next.js app scaffolded and building, with the
> core schema and TCO-engine skeleton in place. The four decision views are
> stubs. See [`docs/SPEC.md`](docs/SPEC.md) for the roadmap.

## Why this exists

We're a two-person household trying to buy a car and we believe in
optimization: don't spend unnecessary money. Most "best car" advice is vibes and
affiliate links. We want the numbers, pulled live, for our state and our
commute.

## The big idea: it's all one engine

Every question above is really the same question — **"what is the total cost of
meeting our driving needs under option X?"** So the heart of DriveWise is a
**Total Cost of Ownership (TCO) engine**. Each user story is just a different
slice or comparison built on top of it. Build the engine once; reuse everywhere.

## Tech stack

- **Next.js (App Router) + TypeScript** — full-stack web app, easy to share via a URL.
- **API routes / server actions** for fetching and caching live data.
- **Recharts** (or similar) for break-even and sensitivity charts.
- **Zod** for validating external API responses and user input.
- Deploy on **Vercel** (free tier is plenty).

## Getting started

Requires **Node 22** (an `.nvmrc` pins it; the repo will not build on older
Node). Then:

```bash
nvm use            # picks up .nvmrc → Node 22
npm install
npm run dev        # http://localhost:3000
```

Other scripts: `npm run build`, `npm run lint`.

Copy `.env.example` → `.env.local` and add the free API keys (EIA, FRED) once
the data layer is wired up in Phase 1.

Implementation phases are in [`docs/SPEC.md`](docs/SPEC.md). Live data sources,
their gotchas, and the researched free substitutes are in
[`docs/DATA_SOURCES.md`](docs/DATA_SOURCES.md). The seed car shortlist is in
[`docs/CAR_SHORTLIST.md`](docs/CAR_SHORTLIST.md).
