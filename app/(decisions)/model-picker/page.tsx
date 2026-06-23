"use client";

import { useMemo, useState } from "react";
import { ProfileFields, useStoredProfile } from "@/components/ProfileFields";
import { CarImage } from "@/components/CarImage";
import { computeTco, type MarketInputs } from "@/lib/tco";
import { SEED_VEHICLES } from "@/lib/models/seed";
import { RESALE_RATIO_5YR } from "@/lib/tco/defaults";
import type { DrivingProfile, UsState } from "@/lib/schema";
import { money, moneyCents } from "@/lib/format";
import { fetchMarket } from "../_market";
import { OBJECTIVES, type Objective } from "./objectives";

const PT_LABEL: Record<string, string> = {
  gas: "Gas",
  hybrid: "Hybrid",
  ev: "EV",
  phev: "PHEV",
};

export default function ModelPickerPage() {
  const [profile, setProfile] = useStoredProfile();
  const [objective, setObjective] = useState<Objective>("lowest_tco");
  const [market, setMarket] = useState<MarketInputs | null>(null);
  const [pending, setPending] = useState(false);

  const [gas, setGas] = useState(3.5);
  const [miles, setMiles] = useState(12000);
  const [years, setYears] = useState(5);

  async function run() {
    setPending(true);
    try {
      const m = await fetchMarket(profile.state);
      setMarket(m);
      setGas(round(m.gasPricePerGallon, 2));
      setMiles(profile.annualMiles);
      setYears(Math.max(1, Math.round(profile.ownershipYears)));
    } finally {
      setPending(false);
    }
  }

  const rows = useMemo(() => {
    if (!market) return null;
    const effMarket: MarketInputs = {
      gasPricePerGallon: gas,
      electricityPricePerKwh: market.electricityPricePerKwh,
      loanApr: market.loanApr,
    };
    const list = SEED_VEHICLES.map((vehicle) => {
      const effProfile: DrivingProfile = {
        state: profile.state as UsState,
        homeCharging: profile.homeCharging,
        annualMiles: miles,
        ownershipYears: years,
        routes: [],
      };
      return {
        vehicle,
        result: computeTco(vehicle, effProfile, effMarket),
        resaleRatio:
          vehicle.resaleRatio5yr ?? RESALE_RATIO_5YR[vehicle.bodyStyle],
      };
    });
    list.sort((a, b) => {
      switch (objective) {
        case "lowest_tco":
          return a.result.total - b.result.total;
        case "best_efficiency":
          return (b.vehicle.combinedMpg ?? 0) - (a.vehicle.combinedMpg ?? 0);
        case "slowest_depreciation":
          return b.resaleRatio - a.resaleRatio;
        case "most_reliable":
          return (b.vehicle.reliability ?? 0) - (a.vehicle.reliability ?? 0);
      }
    });
    return list;
  }, [market, gas, miles, years, objective, profile.state, profile.homeCharging]);

  const maxTotal = rows ? Math.max(...rows.map((r) => r.result.total)) : 1;
  const slider = "w-full accent-emerald-600";

  return (
    <main className="mx-auto flex max-w-3xl flex-1 flex-col gap-8 px-6 py-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Which car?</h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-300">
          The 20-car best-value shortlist, ranked for your situation. MPG is real
          EPA data; drag the sliders to see the ranking shift live.
        </p>
      </div>

      <section className="flex flex-col gap-4 rounded-xl border border-zinc-200 p-5 dark:border-zinc-800">
        <ProfileFields value={profile} onChange={setProfile} />
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-600 dark:text-zinc-400">Optimize for</span>
          <select
            className="max-w-xs rounded border border-zinc-300 bg-transparent px-2 py-1.5 dark:border-zinc-700"
            value={objective}
            onChange={(e) => setObjective(e.target.value as Objective)}
          >
            {Object.entries(OBJECTIVES).map(([k, label]) => (
              <option key={k} value={k}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <button
          onClick={run}
          disabled={pending}
          className="self-start rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {pending ? "Fetching prices…" : market ? "Refresh prices" : "Rank the cars"}
        </button>
      </section>

      {rows && (
        <>
          <section className="grid gap-4 rounded-xl border border-zinc-200 p-5 dark:border-zinc-800 sm:grid-cols-3">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-zinc-600 dark:text-zinc-400">
                Gas {moneyCents(gas)}/gal
              </span>
              <input type="range" min={2} max={7} step={0.1} value={gas} onChange={(e) => setGas(Number(e.target.value))} className={slider} />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-zinc-600 dark:text-zinc-400">
                {miles.toLocaleString()} mi/yr
              </span>
              <input type="range" min={3000} max={30000} step={1000} value={miles} onChange={(e) => setMiles(Number(e.target.value))} className={slider} />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-zinc-600 dark:text-zinc-400">
                Keep {years} {years === 1 ? "year" : "years"}
              </span>
              <input type="range" min={1} max={12} step={1} value={years} onChange={(e) => setYears(Number(e.target.value))} className={slider} />
            </label>
          </section>

          <section className="flex flex-col gap-2">
            {rows.map((row, i) => (
              <div
                key={row.vehicle.id}
                className={`flex items-center gap-3 rounded-xl border p-3 ${
                  i === 0
                    ? "border-emerald-500/50 bg-emerald-500/5"
                    : "border-zinc-200 dark:border-zinc-800"
                }`}
              >
                <span className="w-5 shrink-0 text-center text-sm text-zinc-400">
                  {i + 1}
                </span>
                <CarImage
                  make={row.vehicle.make}
                  model={row.vehicle.model}
                  className="h-12 w-20 shrink-0 rounded-md"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="truncate font-medium">
                      {row.vehicle.make} {row.vehicle.model}
                    </p>
                    <p className="shrink-0 font-semibold tabular-nums">
                      {money(row.result.total)}
                    </p>
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="h-2 flex-1 rounded bg-zinc-100 dark:bg-zinc-800">
                      <span
                        className="block h-2 rounded bg-emerald-500/80"
                        style={{ width: `${(row.result.total / maxTotal) * 100}%` }}
                      />
                    </span>
                    <span className="shrink-0 text-xs text-zinc-500">
                      {PT_LABEL[row.vehicle.powertrain]} ·{" "}
                      {row.vehicle.combinedMpg ?? "—"} mpg ·{" "}
                      {Math.round(row.resaleRatio * 100)}% resale
                      {row.vehicle.reliability != null && (
                        <> · {Math.round(row.vehicle.reliability * 100)} reliability</>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </section>
        </>
      )}
    </main>
  );
}

function round(n: number, dp: number): number {
  const f = 10 ** dp;
  return Math.round(n * f) / f;
}
