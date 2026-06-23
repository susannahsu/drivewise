"use client";

import { useState } from "react";
import Link from "next/link";
import { useStoredProfile } from "@/components/ProfileFields";
import { SEED_VEHICLES } from "@/lib/models/seed";
import { US_STATES } from "@/lib/schema";
import { money } from "@/lib/format";
import { compareRideshare, type RideshareAnalysis } from "./actions";

export default function OwnVsRidesharePage() {
  const [profile, setProfile] = useStoredProfile();
  const [vehicleId, setVehicleId] = useState(SEED_VEHICLES[0].id);
  const [route, setRoute] = useState({
    oneWayMiles: 8,
    daysPerWeek: 5,
    departTime: "08:00",
    returnTime: "17:30",
  });
  const [analysis, setAnalysis] = useState<RideshareAnalysis | null>(null);
  const [pending, setPending] = useState(false);

  const setRouteField = (k: keyof typeof route, v: string | number) =>
    setRoute((r) => ({ ...r, [k]: v }));

  async function run() {
    setPending(true);
    try {
      setAnalysis(
        await compareRideshare({
          state: profile.state,
          ownershipYears: profile.ownershipYears,
          homeCharging: profile.homeCharging,
          vehicleId,
          route,
        }),
      );
    } finally {
      setPending(false);
    }
  }

  const field =
    "rounded border border-zinc-300 bg-transparent px-2 py-1.5 dark:border-zinc-700";

  return (
    <main className="mx-auto flex max-w-3xl flex-1 flex-col gap-8 px-6 py-12">
      <div>
        <Link href="/" className="text-sm text-zinc-500 hover:underline">
          ← all decisions
        </Link>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          Own a car, or just Uber?
        </h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-300">
          Your real commute (with rush-hour surge) vs the fixed monthly cost of
          owning. Owning is fixed; rideshare scales with how often you go.
        </p>
      </div>

      <section className="flex flex-col gap-4 rounded-xl border border-zinc-200 p-5 dark:border-zinc-800">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-zinc-600 dark:text-zinc-400">State</span>
            <select
              className={field}
              value={profile.state}
              onChange={(e) => setProfile({ ...profile, state: e.target.value })}
            >
              {US_STATES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-zinc-600 dark:text-zinc-400">
              Car you&apos;d otherwise own
            </span>
            <select
              className={field}
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
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-zinc-600 dark:text-zinc-400">
              One-way commute miles
            </span>
            <input
              type="number"
              min={1}
              className={field}
              value={route.oneWayMiles}
              onChange={(e) =>
                setRouteField("oneWayMiles", Number(e.target.value))
              }
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-zinc-600 dark:text-zinc-400">
              Commuting days / week
            </span>
            <input
              type="number"
              min={1}
              max={7}
              className={field}
              value={route.daysPerWeek}
              onChange={(e) =>
                setRouteField("daysPerWeek", Number(e.target.value))
              }
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-zinc-600 dark:text-zinc-400">Depart time</span>
            <input
              type="time"
              className={field}
              value={route.departTime}
              onChange={(e) => setRouteField("departTime", e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-zinc-600 dark:text-zinc-400">Return time</span>
            <input
              type="time"
              className={field}
              value={route.returnTime}
              onChange={(e) => setRouteField("returnTime", e.target.value)}
            />
          </label>
        </div>
        <button
          onClick={run}
          disabled={pending}
          className="self-start rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {pending ? "Comparing…" : "Compare"}
        </button>
      </section>

      {analysis && (
        <section className="flex flex-col gap-5">
          <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/5 p-5">
            <p className="text-sm text-zinc-500">Cheaper for this commute</p>
            <p className="text-xl font-semibold">
              {analysis.cheaper === "own"
                ? `Own the ${analysis.vehicleLabel}`
                : "Skip the car — rideshare"}
            </p>
            <p className="mt-1 text-sm text-zinc-500">
              Break-even ≈ {analysis.breakEvenDays.toFixed(1)} commuting
              days/week. Below that, rideshare wins; above it, owning does.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-zinc-200 p-5 dark:border-zinc-800">
              <p className="text-sm text-zinc-500">Own (all-in)</p>
              <p className="text-2xl font-semibold tabular-nums">
                {money(analysis.ownedMonthly)}
                <span className="text-base font-normal text-zinc-500">/mo</span>
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                Fixed regardless of how much you drive · ~
                {analysis.commuteAnnualMiles.toLocaleString()} mi/yr commute
              </p>
            </div>
            <div className="rounded-xl border border-zinc-200 p-5 dark:border-zinc-800">
              <p className="text-sm text-zinc-500">Rideshare</p>
              <p className="text-2xl font-semibold tabular-nums">
                {money(analysis.rideshareMonthly)}
                <span className="text-base font-normal text-zinc-500">/mo</span>
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                Scales with use · no parking, maintenance, or insurance
              </p>
            </div>
          </div>
          <p className="text-xs text-zinc-400">
            Fares are modeled from typical metro rate cards, not a live quote —
            calibrate by checking one real fare for your route. Owning also
            covers non-commute trips this comparison doesn&apos;t count.
          </p>
        </section>
      )}
    </main>
  );
}
