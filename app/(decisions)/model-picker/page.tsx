"use client";

import { useState } from "react";
import Link from "next/link";
import { ProfileFields, useStoredProfile } from "@/components/ProfileFields";
import { money } from "@/lib/format";
import { rankModels, type ModelRow } from "./actions";
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
  const [rows, setRows] = useState<ModelRow[] | null>(null);
  const [pending, setPending] = useState(false);

  async function run() {
    setPending(true);
    try {
      setRows(await rankModels({ ...profile, objective }));
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="mx-auto flex max-w-3xl flex-1 flex-col gap-8 px-6 py-12">
      <div>
        <Link href="/" className="text-sm text-zinc-500 hover:underline">
          ← all decisions
        </Link>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          Which brand &amp; model?
        </h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-300">
          The 20-car best-value shortlist, ranked for your situation and chosen
          objective. (Specs are estimates pending calibration.)
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
          {pending ? "Ranking…" : "Rank models"}
        </button>
      </section>

      {rows && (
        <section className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-left text-zinc-500 dark:border-zinc-800">
                <th className="py-2 pr-2">#</th>
                <th className="py-2 pr-2">Model</th>
                <th className="py-2 pr-2">Type</th>
                <th className="py-2 pr-2 text-right">MSRP</th>
                <th className="py-2 pr-2 text-right">MPG</th>
                <th className="py-2 pr-2 text-right">5yr resale</th>
                <th className="py-2 text-right">Total cost</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr
                  key={row.vehicle.id}
                  className={
                    i === 0
                      ? "border-b border-zinc-100 bg-emerald-500/5 dark:border-zinc-900"
                      : "border-b border-zinc-100 dark:border-zinc-900"
                  }
                >
                  <td className="py-2 pr-2 text-zinc-400">{i + 1}</td>
                  <td className="py-2 pr-2 font-medium">
                    {row.vehicle.make} {row.vehicle.model}
                  </td>
                  <td className="py-2 pr-2 text-zinc-500">
                    {PT_LABEL[row.vehicle.powertrain]}
                  </td>
                  <td className="py-2 pr-2 text-right tabular-nums">
                    {money(row.vehicle.msrp)}
                  </td>
                  <td className="py-2 pr-2 text-right tabular-nums">
                    {row.vehicle.combinedMpg ?? "—"}
                  </td>
                  <td className="py-2 pr-2 text-right tabular-nums">
                    {Math.round(row.resaleRatio * 100)}%
                  </td>
                  <td className="py-2 text-right font-semibold tabular-nums">
                    {money(row.result.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </main>
  );
}
