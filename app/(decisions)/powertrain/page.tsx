"use client";

import { useMemo, useState } from "react";
import { ProfileFields, useStoredProfile } from "@/components/ProfileFields";
import { useAutoRun, useHydrated } from "@/components/useAutoRun";
import { ResultsSkeleton } from "@/components/ResultsSkeleton";
import { CostBreakdown } from "@/components/CostBreakdown";
import { Assumptions } from "@/components/Assumptions";
import { BreakEvenChart, SERIES_COLORS } from "@/components/BreakEvenChart";
import { computeTco, type MarketInputs } from "@/lib/tco";
import type { MarketData } from "@/lib/data/market";
import { LivePrices } from "@/components/LivePrices";
import { REPRESENTATIVE_VEHICLES } from "@/lib/models/representative";
import { keepCurrentCar } from "@/lib/tco/keep";
import { evIncentive } from "@/lib/tco/incentives";
import { estimateAnnualInsurance } from "@/lib/tco/insurance";
import { ANNUAL_REGISTRATION } from "@/lib/tco/defaults";
import type { DrivingProfile, UsState } from "@/lib/schema";
import { money, moneyCents, perMile } from "@/lib/format";
import { fetchMarket } from "../_market";

const POWERTRAIN_LABEL: Record<string, string> = {
  gas: "Gas",
  hybrid: "Hybrid",
  ev: "Electric",
  phev: "Plug-in hybrid",
};

export default function PowertrainPage() {
  const [profile, setProfile] = useStoredProfile();
  const [market, setMarket] = useState<MarketData | null>(null);
  const [pending, setPending] = useState(false);

  // Sensitivity "what-if" overrides, seeded from the live values on first fetch.
  const [gas, setGas] = useState(3.5);
  const [elec, setElec] = useState(0.17);
  const [miles, setMiles] = useState(12000);
  const [applyIncentives, setApplyIncentives] = useState(true);

  // "Don't buy yet" comparison.
  const [keepOn, setKeepOn] = useState(false);
  const [keepMpg, setKeepMpg] = useState(28);
  const [keepMaint, setKeepMaint] = useState(1800);

  async function run() {
    setPending(true);
    try {
      const m = await fetchMarket(profile.state);
      setMarket(m);
      setGas(round(m.gasPricePerGallon, 2));
      setElec(round(m.electricityPricePerKwh, 2));
      setMiles(profile.annualMiles);
    } finally {
      setPending(false);
    }
  }

  useAutoRun(run, useHydrated());

  const analysis = useMemo(() => {
    if (!market) return null;
    const years = Math.max(1, Math.round(profile.ownershipYears));
    const effMarket: MarketInputs = {
      gasPricePerGallon: gas,
      electricityPricePerKwh: elec,
      loanApr: market.loanApr,
    };
    const effProfile: DrivingProfile = {
      state: profile.state as UsState,
      homeCharging: profile.homeCharging,
      annualMiles: miles,
      ownershipYears: years,
      routes: [],
    };

    const rows = REPRESENTATIVE_VEHICLES.map((vehicle) => {
      const incentive = applyIncentives
        ? evIncentive(vehicle, profile.state as UsState).total
        : 0;
      return {
        vehicle,
        incentive,
        result: computeTco(vehicle, effProfile, effMarket, undefined, {
          incentive,
        }),
      };
    }).sort((a, b) => a.result.total - b.result.total);

    const keep = keepOn
      ? keepCurrentCar(
          {
            annualMiles: miles,
            gasPricePerGallon: gas,
            currentMpg: keepMpg,
            annualMaintenance: keepMaint,
            insuranceAnnual:
              estimateAnnualInsurance("compact", profile.state as UsState) * 0.8,
            registrationAnnual: ANNUAL_REGISTRATION,
          },
          years,
        )
      : null;

    const series = rows.map((r, i) => ({
      label: POWERTRAIN_LABEL[r.vehicle.powertrain],
      color: SERIES_COLORS[i % SERIES_COLORS.length],
      values: r.result.cumulativeByYear,
    }));
    if (keep) {
      series.push({
        label: "Keep current car",
        color: "#71717a",
        values: keep.cumulativeByYear,
      });
    }

    return { rows, keep, series, years, loanApr: market.loanApr };
  }, [market, gas, elec, miles, profile, keepOn, keepMpg, keepMaint, applyIncentives]);

  const winner = analysis?.rows[0];
  const slider =
    "w-full accent-emerald-600";

  return (
    <main className="mx-auto flex max-w-3xl flex-1 flex-col gap-8 px-6 py-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Hybrid, gas, or electric?
        </h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-300">
          Total cost of ownership for a representative compact in each
          powertrain, with live prices and what-if sliders.
        </p>
      </div>

      <section className="flex flex-col gap-4 rounded-xl border border-zinc-200 p-5 dark:border-zinc-800">
        <ProfileFields value={profile} onChange={setProfile} />
        <button
          onClick={run}
          disabled={pending}
          className="self-start rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {pending ? "Fetching prices…" : "Refresh prices"}
        </button>
      </section>

      {!analysis && pending && <ResultsSkeleton />}

      {analysis && winner && (
        <>
          <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/5 p-5">
            <p className="text-sm text-zinc-500">Cheapest to own</p>
            <p className="text-xl font-semibold">
              {POWERTRAIN_LABEL[winner.vehicle.powertrain]} —{" "}
              {money(winner.result.total)} over {analysis.years} yrs
              <span className="ml-2 font-normal text-zinc-500">
                ({money(winner.result.perMonth)}/mo · {perMile(winner.result.perMile)})
              </span>
            </p>
          </div>

          {/* Sensitivity sliders */}
          <section className="flex flex-col gap-4 rounded-xl border border-zinc-200 p-5 dark:border-zinc-800">
            <h2 className="text-sm font-semibold text-zinc-500">
              What if… (drag to test how robust the answer is)
            </h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-zinc-600 dark:text-zinc-400">
                  Gas {moneyCents(gas)}/gal
                </span>
                <input
                  type="range"
                  min={2}
                  max={7}
                  step={0.1}
                  value={gas}
                  onChange={(e) => setGas(Number(e.target.value))}
                  className={slider}
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-zinc-600 dark:text-zinc-400">
                  Electricity {moneyCents(elec)}/kWh
                </span>
                <input
                  type="range"
                  min={0.08}
                  max={0.5}
                  step={0.01}
                  value={elec}
                  onChange={(e) => setElec(Number(e.target.value))}
                  className={slider}
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-zinc-600 dark:text-zinc-400">
                  {miles.toLocaleString()} mi/yr
                </span>
                <input
                  type="range"
                  min={3000}
                  max={30000}
                  step={1000}
                  value={miles}
                  onChange={(e) => setMiles(Number(e.target.value))}
                  className={slider}
                />
              </label>
            </div>
            {market && <LivePrices market={market} />}
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 text-xs text-zinc-500">
                <input
                  type="checkbox"
                  checked={applyIncentives}
                  onChange={(e) => setApplyIncentives(e.target.checked)}
                />
                Apply EV incentives ({money(evIncentive(REPRESENTATIVE_VEHICLES.find((v) => v.powertrain === "ev")!, profile.state as UsState).total)} off the EV here)
              </label>
              <p className="text-xs text-zinc-400">
                {profile.homeCharging
                  ? "EV charged at home."
                  : "No home charging: EV uses public-rate electricity (~3x)."}{" "}
                Incentives = federal clean-vehicle credit + your state rebate, if
                eligible.
              </p>
            </div>
          </section>

          {/* Break-even chart */}
          <section className="flex flex-col gap-3 rounded-xl border border-zinc-200 p-5 dark:border-zinc-800">
            <h2 className="font-semibold">Cumulative cost over time</h2>
            <p className="text-xs text-zinc-500">
              Lowest line wins by that year; where lines cross is the break-even.
            </p>
            <BreakEvenChart series={analysis.series} />
          </section>

          {/* Keep current car */}
          <section className="flex flex-col gap-3 rounded-xl border border-zinc-200 p-5 dark:border-zinc-800">
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={keepOn}
                onChange={(e) => setKeepOn(e.target.checked)}
              />
              Compare against keeping my current car
            </label>
            {keepOn && analysis.keep && (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="flex flex-col gap-1 text-sm">
                    <span className="text-zinc-600 dark:text-zinc-400">
                      Current car MPG
                    </span>
                    <input
                      type="number"
                      min={10}
                      max={60}
                      value={keepMpg}
                      onChange={(e) => setKeepMpg(Number(e.target.value))}
                      className="rounded border border-zinc-300 bg-transparent px-2 py-1.5 dark:border-zinc-700"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-sm">
                    <span className="text-zinc-600 dark:text-zinc-400">
                      Annual maintenance &amp; repairs
                    </span>
                    <input
                      type="number"
                      min={0}
                      step={100}
                      value={keepMaint}
                      onChange={(e) => setKeepMaint(Number(e.target.value))}
                      className="rounded border border-zinc-300 bg-transparent px-2 py-1.5 dark:border-zinc-700"
                    />
                  </label>
                </div>
                <p className="text-sm">
                  Keeping your current car costs ~
                  <strong>{money(analysis.keep.perYear)}/yr</strong> (
                  {money(analysis.keep.total)} over {analysis.years} yrs) — no new
                  depreciation or financing. Buying the {" "}
                  {POWERTRAIN_LABEL[winner.vehicle.powertrain].toLowerCase()} only
                  makes sense if you value the new car more than the {" "}
                  {money(winner.result.total - analysis.keep.total)} difference.
                </p>
              </>
            )}
          </section>

          {/* Breakdowns */}
          <section className="flex flex-col gap-5">
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
                  <span className="font-semibold tabular-nums">
                    {money(row.result.total)}
                  </span>
                </div>
                <CostBreakdown result={row.result} />
                <Assumptions
                  vehicle={row.vehicle}
                  state={profile.state as UsState}
                  loanApr={analysis.loanApr}
                  homeCharging={profile.homeCharging}
                  incentiveApplied={applyIncentives}
                />
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
