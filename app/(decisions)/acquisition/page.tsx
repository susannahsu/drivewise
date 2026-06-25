"use client";

import { useState } from "react";
import { ProfileFields, useStoredProfile } from "@/components/ProfileFields";
import { useAutoRun } from "@/components/useAutoRun";
import { ResultsSkeleton } from "@/components/ResultsSkeleton";
import { CostBreakdown } from "@/components/CostBreakdown";
import { Assumptions } from "@/components/Assumptions";
import { BreakEvenChart, SERIES_COLORS } from "@/components/BreakEvenChart";
import { CarImage } from "@/components/CarImage";
import { DealerFinder } from "@/components/DealerFinder";
import { DealRater } from "@/components/DealRater";
import { SEED_VEHICLES } from "@/lib/models/seed";
import type { UsState } from "@/lib/schema";
import { money } from "@/lib/format";
import {
  compareAcquisition,
  type AcquisitionAnalysis,
} from "./actions";

export default function AcquisitionPage() {
  const [profile, setProfile] = useStoredProfile();
  const [vehicleId, setVehicleId] = useState(SEED_VEHICLES[0].id);
  const [analysis, setAnalysis] = useState<AcquisitionAnalysis | null>(null);
  const [pending, setPending] = useState(false);
  const selected = SEED_VEHICLES.find((v) => v.id === vehicleId)!;

  async function run() {
    setPending(true);
    try {
      setAnalysis(await compareAcquisition({ ...profile, vehicleId }));
    } finally {
      setPending(false);
    }
  }

  useAutoRun(run);

  return (
    <main className="mx-auto flex max-w-3xl flex-1 flex-col gap-8 px-6 py-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Lease, buy new, or buy used?
        </h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-300">
          Three acquisition strategies for one model over your ownership
          horizon. Lease favors short horizons; buy-and-hold favors long ones.
        </p>
      </div>

      <section className="flex flex-col gap-4 rounded-xl border border-zinc-200 p-5 dark:border-zinc-800">
        <ProfileFields value={profile} onChange={setProfile} />
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-600 dark:text-zinc-400">Model</span>
          <select
            className="max-w-xs rounded border border-zinc-300 bg-transparent px-2 py-1.5 dark:border-zinc-700"
            value={vehicleId}
            onChange={(e) => setVehicleId(e.target.value)}
          >
            {SEED_VEHICLES.map((v) => (
              <option key={v.id} value={v.id}>
                {v.make} {v.model}
              </option>
            ))}
          </select>
        </label>
        <button
          onClick={run}
          disabled={pending}
          className="self-start rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {pending ? "Comparing…" : "Refresh"}
        </button>
      </section>

      {!analysis && pending && <ResultsSkeleton />}

      {analysis && (
        <section className="flex flex-col gap-5">
          <div className="flex items-center gap-4">
            <CarImage
              make={selected.make}
              model={selected.model}
              className="h-14 w-24 shrink-0 rounded-md"
            />
            <p className="text-sm text-zinc-500">
              {analysis.vehicleLabel} — cheapest:{" "}
              <span className="font-semibold text-emerald-600">
                {analysis.options[0].label}
              </span>{" "}
              at {money(analysis.options[0].result.total)}
            </p>
          </div>

          <div className="rounded-xl border border-zinc-200 p-5 dark:border-zinc-800">
            <h2 className="mb-3 font-semibold">Cumulative cost over time</h2>
            <BreakEvenChart
              series={analysis.options.map((opt, i) => ({
                label: opt.label,
                color: SERIES_COLORS[i % SERIES_COLORS.length],
                values: opt.result.cumulativeByYear,
              }))}
            />
          </div>

          {analysis.options.map((opt, i) => (
            <div
              key={opt.key}
              className={`rounded-xl border p-5 ${
                i === 0
                  ? "border-emerald-500/40 bg-emerald-500/5"
                  : "border-zinc-200 dark:border-zinc-800"
              }`}
            >
              <div className="mb-1 flex items-baseline justify-between">
                <h2 className="font-semibold">
                  {i + 1}. {opt.label}
                </h2>
                <span className="tabular-nums font-semibold">
                  {money(opt.result.total)}
                  <span className="ml-2 font-normal text-zinc-500">
                    {money(opt.result.perMonth)}/mo
                  </span>
                </span>
              </div>
              <p className="mb-3 text-xs text-zinc-500">{opt.note}</p>
              <CostBreakdown result={opt.result} />
              {opt.key !== "lease" && (
                <Assumptions
                  vehicle={selected}
                  state={profile.state as UsState}
                  loanApr={analysis.loanApr}
                  homeCharging={profile.homeCharging}
                />
              )}
            </div>
          ))}

          <DealRater msrp={selected.msrp} marketApr={analysis.loanApr} />

          <DealerFinder
            make={selected.make}
            model={selected.model}
            state={profile.state}
          />
        </section>
      )}
    </main>
  );
}
