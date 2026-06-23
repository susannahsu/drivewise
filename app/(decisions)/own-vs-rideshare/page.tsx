"use client";

import { useMemo, useState } from "react";
import { useStoredProfile } from "@/components/ProfileFields";
import { BreakEvenChart, SERIES_COLORS } from "@/components/BreakEvenChart";
import { CarImage } from "@/components/CarImage";
import { computeTco, type MarketInputs } from "@/lib/tco";
import { SEED_VEHICLES } from "@/lib/models/seed";
import {
  DEFAULT_FARE_MODEL,
  monthlyRideshareCost,
} from "@/lib/data/rideshare-model";
import { US_STATES, type DrivingProfile, type UsState } from "@/lib/schema";
import { money, moneyCents } from "@/lib/format";
import { fetchMarket } from "../_market";

const DAYS = [1, 2, 3, 4, 5, 6, 7];

export default function OwnVsRidesharePage() {
  const [profile, setProfile] = useStoredProfile();
  const [vehicleId, setVehicleId] = useState(SEED_VEHICLES[0].id);
  const [market, setMarket] = useState<MarketInputs | null>(null);
  const [pending, setPending] = useState(false);

  const [oneWayMiles, setOneWayMiles] = useState(8);
  const [daysPerWeek, setDaysPerWeek] = useState(5);
  const [departTime, setDepartTime] = useState("08:00");
  const [returnTime, setReturnTime] = useState("17:30");
  const [perMile, setPerMile] = useState(DEFAULT_FARE_MODEL.perMile);

  async function run() {
    setPending(true);
    try {
      setMarket(await fetchMarket(profile.state));
    } finally {
      setPending(false);
    }
  }

  const analysis = useMemo(() => {
    if (!market) return null;
    const vehicle = SEED_VEHICLES.find((v) => v.id === vehicleId)!;
    const fareModel = { ...DEFAULT_FARE_MODEL, perMile };
    const years = Math.max(1, Math.round(profile.ownershipYears));

    const ownAt = (d: number) => {
      const p: DrivingProfile = {
        state: profile.state as UsState,
        homeCharging: profile.homeCharging,
        annualMiles: Math.max(1000, oneWayMiles * 2 * d * 52),
        ownershipYears: years,
        routes: [],
      };
      return computeTco(vehicle, p, market).perMonth;
    };
    const rideAt = (d: number) =>
      monthlyRideshareCost(
        { oneWayMiles, daysPerWeek: d, departTime, returnTime },
        fareModel,
      );

    const ownValues = DAYS.map(ownAt);
    const rideValues = DAYS.map(rideAt);

    // First day-count where rideshare becomes more expensive than owning.
    let breakEven: number | null = null;
    for (const d of DAYS) {
      if (rideAt(d) >= ownAt(d)) {
        breakEven = d;
        break;
      }
    }

    const own = ownAt(daysPerWeek);
    const ride = rideAt(daysPerWeek);

    return {
      vehicleLabel: `${vehicle.make} ${vehicle.model}`,
      make: vehicle.make,
      model: vehicle.model,
      own,
      ride,
      breakEven,
      series: [
        { label: "Own", color: SERIES_COLORS[0], values: ownValues },
        { label: "Rideshare", color: SERIES_COLORS[1], values: rideValues },
      ],
    };
  }, [
    market,
    vehicleId,
    perMile,
    oneWayMiles,
    daysPerWeek,
    departTime,
    returnTime,
    profile.state,
    profile.homeCharging,
    profile.ownershipYears,
  ]);

  const field =
    "rounded border border-zinc-300 bg-transparent px-2 py-1.5 dark:border-zinc-700";
  const slider = "w-full accent-emerald-600";

  return (
    <main className="mx-auto flex max-w-3xl flex-1 flex-col gap-8 px-6 py-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Own a car, or just Uber?
        </h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-300">
          Owning is mostly fixed; rideshare scales with how often you go. The
          chart shows where they cross as commuting days rise.
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
            <span className="text-zinc-600 dark:text-zinc-400">Depart time</span>
            <input
              type="time"
              className={field}
              value={departTime}
              onChange={(e) => setDepartTime(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-zinc-600 dark:text-zinc-400">Return time</span>
            <input
              type="time"
              className={field}
              value={returnTime}
              onChange={(e) => setReturnTime(e.target.value)}
            />
          </label>
        </div>
        <button
          onClick={run}
          disabled={pending}
          className="self-start rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {pending ? "Fetching prices…" : market ? "Refresh prices" : "Compare"}
        </button>
      </section>

      {analysis && (
        <>
          <section className="grid gap-4 rounded-xl border border-zinc-200 p-5 dark:border-zinc-800 sm:grid-cols-3">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-zinc-600 dark:text-zinc-400">
                {oneWayMiles} mi each way
              </span>
              <input type="range" min={1} max={40} step={1} value={oneWayMiles} onChange={(e) => setOneWayMiles(Number(e.target.value))} className={slider} />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-zinc-600 dark:text-zinc-400">
                {daysPerWeek} commuting days/wk
              </span>
              <input type="range" min={1} max={7} step={1} value={daysPerWeek} onChange={(e) => setDaysPerWeek(Number(e.target.value))} className={slider} />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-zinc-600 dark:text-zinc-400">
                Fare {moneyCents(perMile)}/mi (calibrate)
              </span>
              <input type="range" min={0.6} max={3} step={0.05} value={perMile} onChange={(e) => setPerMile(Number(e.target.value))} className={slider} />
            </label>
          </section>

          <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/5 p-5">
            <div className="flex items-center gap-4">
              <CarImage
                make={analysis.make}
                model={analysis.model}
                className="h-14 w-24 shrink-0 rounded-md"
              />
              <div>
                <p className="text-sm text-zinc-500">
                  At {daysPerWeek} days/week, cheaper option:
                </p>
                <p className="text-xl font-semibold">
                  {analysis.ride < analysis.own
                    ? "Skip the car — rideshare"
                    : `Own the ${analysis.vehicleLabel}`}
                </p>
                <p className="mt-1 text-sm text-zinc-500">
                  Own {money(analysis.own)}/mo vs rideshare{" "}
                  {money(analysis.ride)}/mo ·{" "}
                  {analysis.breakEven
                    ? `owning wins from ~${analysis.breakEven} day${analysis.breakEven > 1 ? "s" : ""}/week up`
                    : "rideshare stays cheaper even at 7 days/week"}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 p-5 dark:border-zinc-800">
            <h2 className="mb-1 font-semibold">Monthly cost vs commuting days</h2>
            <p className="mb-3 text-xs text-zinc-500">
              Where the lines cross is your break-even. $/month on the y-axis.
            </p>
            <BreakEvenChart series={analysis.series} xLabel={(i) => `${i + 1}d`} />
          </div>

          <p className="text-xs text-zinc-400">
            Fares are modeled from typical metro rate cards with rush-hour surge,
            not a live quote — drag the fare slider to match one real quote for
            your route. Owning also covers non-commute trips this doesn&apos;t count.
          </p>
        </>
      )}
    </main>
  );
}
