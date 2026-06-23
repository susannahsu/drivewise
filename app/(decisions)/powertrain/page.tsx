"use client";

import { useState } from "react";
import Link from "next/link";
import { ProfileFields, useStoredProfile } from "@/components/ProfileFields";
import { CostBreakdown } from "@/components/CostBreakdown";
import { money, moneyCents, perMile } from "@/lib/format";
import { analyzePowertrain, type PowertrainAnalysis } from "./actions";

const POWERTRAIN_LABEL: Record<string, string> = {
  gas: "Gas",
  hybrid: "Hybrid",
  ev: "Electric",
  phev: "Plug-in hybrid",
};

export default function PowertrainPage() {
  const [profile, setProfile] = useStoredProfile();
  const [analysis, setAnalysis] = useState<PowertrainAnalysis | null>(null);
  const [pending, setPending] = useState(false);

  async function run() {
    setPending(true);
    try {
      setAnalysis(await analyzePowertrain(profile));
    } finally {
      setPending(false);
    }
  }

  const winner = analysis?.rows[0];

  return (
    <main className="mx-auto flex max-w-3xl flex-1 flex-col gap-8 px-6 py-12">
      <div>
        <Link href="/" className="text-sm text-zinc-500 hover:underline">
          ← all decisions
        </Link>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          Hybrid, gas, or electric?
        </h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-300">
          Total cost of ownership for a representative compact in each
          powertrain, using live prices for your state.
        </p>
      </div>

      <section className="flex flex-col gap-4 rounded-xl border border-zinc-200 p-5 dark:border-zinc-800">
        <ProfileFields value={profile} onChange={setProfile} />
        <button
          onClick={run}
          disabled={pending}
          className="self-start rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {pending ? "Crunching…" : "Compare powertrains"}
        </button>
      </section>

      {analysis && winner && (
        <section className="flex flex-col gap-6">
          <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/5 p-5">
            <p className="text-sm text-zinc-500">Cheapest to own</p>
            <p className="text-xl font-semibold">
              {POWERTRAIN_LABEL[winner.vehicle.powertrain]} —{" "}
              {money(winner.result.total)} over {winner.result.horizonYears} yrs
              <span className="ml-2 font-normal text-zinc-500">
                ({money(winner.result.perMonth)}/mo · {perMile(winner.result.perMile)})
              </span>
            </p>
          </div>

          <div className="text-xs text-zinc-500">
            Live inputs: gas {moneyCents(analysis.market.gasPricePerGallon)}/gal ·
            electricity {moneyCents(analysis.market.electricityPricePerKwh)}/kWh ·
            loan APR {(analysis.market.loanApr * 100).toFixed(1)}%. {" "}
            {analysis.effectiveElectricityNote}
          </div>

          <div className="flex flex-col gap-5">
            {analysis.rows.map((row, i) => (
              <div
                key={row.vehicle.id}
                className="rounded-xl border border-zinc-200 p-5 dark:border-zinc-800"
              >
                <div className="mb-3 flex items-baseline justify-between">
                  <h2 className="font-semibold">
                    {i + 1}. {POWERTRAIN_LABEL[row.vehicle.powertrain]}
                    <span className="ml-2 text-sm font-normal text-zinc-500">
                      MSRP {money(row.vehicle.msrp)}
                    </span>
                  </h2>
                  <span className="tabular-nums font-semibold">
                    {money(row.result.total)}
                  </span>
                </div>
                <CostBreakdown result={row.result} />
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
