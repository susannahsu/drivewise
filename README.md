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

> Status: **Spec / planning phase.** No code yet. See [`docs/SPEC.md`](docs/SPEC.md).

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

Not buildable yet — this repo currently holds the spec. Implementation phases
are in [`docs/SPEC.md`](docs/SPEC.md). Live data sources and their gotchas are in
[`docs/DATA_SOURCES.md`](docs/DATA_SOURCES.md).
