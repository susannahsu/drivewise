"use client";

import { useState } from "react";
import Link from "next/link";
import { CarImage } from "@/components/CarImage";
import { DealerFinder } from "@/components/DealerFinder";
import { saveProfile } from "@/components/ProfileFields";
import { US_STATES, type UsState } from "@/lib/schema";
import { money } from "@/lib/format";
import {
  recommend,
  type BodyStylePref,
  type GuideAnswers,
  type RecObjective,
  type Recommendation,
} from "@/lib/recommend";
import { fetchMarket } from "@/app/(decisions)/_market";
import { OBJECTIVES } from "@/app/(decisions)/model-picker/objectives";

const TOTAL = 7;

const DEFAULTS: GuideAnswers = {
  state: "MA",
  homeCharging: false,
  oneWayMiles: 10,
  daysPerWeek: 5,
  annualMiles: 12000,
  ownershipYears: 5,
  bodyStylePref: "any",
  budgetMax: 35000,
  objective: "lowest_tco",
};

const PT_LABEL: Record<string, string> = {
  gas: "Gas",
  hybrid: "Hybrid",
  ev: "Electric",
};

export default function GuidePage() {
  const [step, setStep] = useState(0);
  const [a, setA] = useState<GuideAnswers>(DEFAULTS);
  const [rec, setRec] = useState<Recommendation | null>(null);
  const [pending, setPending] = useState(false);

  const set = <K extends keyof GuideAnswers>(k: K, v: GuideAnswers[K]) =>
    setA((prev) => ({ ...prev, [k]: v }));

  async function finish() {
    setPending(true);
    try {
      saveProfile({
        state: a.state,
        annualMiles: a.annualMiles,
        ownershipYears: a.ownershipYears,
        homeCharging: a.homeCharging,
      });
      const market = await fetchMarket(a.state);
      setRec(recommend(a, market));
    } finally {
      setPending(false);
    }
  }

  if (rec)
    return (
      <Dashboard
        rec={rec}
        state={a.state}
        objective={a.objective}
        onRestart={() => {
          setRec(null);
          setStep(0);
        }}
      />
    );

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-8 px-6 py-12">
      <div className="flex items-center justify-between">
        <Link href="/" className="text-sm font-bold tracking-tight">
          🚗 DriveWise
        </Link>
        <span className="text-xs text-zinc-400">
          Step {step + 1} of {TOTAL}
        </span>
      </div>

      <div className="h-1.5 w-full rounded-full bg-zinc-100 dark:bg-zinc-800">
        <div
          className="h-1.5 rounded-full bg-emerald-600 transition-all"
          style={{ width: `${((step + 1) / TOTAL) * 100}%` }}
        />
      </div>

      <div className="flex flex-1 flex-col gap-6">{renderStep()}</div>

      <div className="flex items-center justify-between">
        <button
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          className="rounded-lg px-4 py-2 text-sm text-zinc-500 hover:bg-zinc-100 disabled:opacity-0 dark:hover:bg-zinc-800"
        >
          ← Back
        </button>
        {step < TOTAL - 1 ? (
          <button
            onClick={() => setStep((s) => s + 1)}
            className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            Next →
          </button>
        ) : (
          <button
            onClick={finish}
            disabled={pending}
            className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {pending ? "Fetching live prices…" : "See my recommendation"}
          </button>
        )}
      </div>
    </main>
  );

  function renderStep() {
    switch (step) {
      case 0:
        return (
          <Question title="Where will you drive?" hint="Sets your local gas, electricity, insurance, and tax rates.">
            <select
              className="max-w-xs rounded-lg border border-zinc-300 bg-transparent px-3 py-2 dark:border-zinc-700"
              value={a.state}
              onChange={(e) => set("state", e.target.value as UsState)}
            >
              {US_STATES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <Choice
              options={[
                { value: "false", label: "No home charging", hint: "Apartment / street parking" },
                { value: "true", label: "I can charge at home", hint: "Garage or driveway outlet" },
              ]}
              value={String(a.homeCharging)}
              onChange={(v) => set("homeCharging", v === "true")}
            />
          </Question>
        );
      case 1:
        return (
          <Question title="What's your commute?" hint="Used to weigh owning a car against just using Uber/Lyft.">
            <Slider label={`${a.oneWayMiles} miles each way`} min={1} max={40} step={1} value={a.oneWayMiles} onChange={(v) => set("oneWayMiles", v)} />
            <Slider label={`${a.daysPerWeek} commuting days / week`} min={1} max={7} step={1} value={a.daysPerWeek} onChange={(v) => set("daysPerWeek", v)} />
          </Question>
        );
      case 2:
        return (
          <Question title="Total miles a year?" hint={`Commute alone is about ${(a.oneWayMiles * 2 * a.daysPerWeek * 52).toLocaleString()} mi/yr — add errands, trips, etc.`}>
            <Slider label={`${a.annualMiles.toLocaleString()} miles / year`} min={3000} max={30000} step={1000} value={a.annualMiles} onChange={(v) => set("annualMiles", v)} />
          </Question>
        );
      case 3:
        return (
          <Question title="How long will you keep it?" hint="The single biggest lever on cost. Short = lease-friendly; long = buy-and-hold.">
            <Slider label={`${a.ownershipYears} ${a.ownershipYears === 1 ? "year" : "years"}`} min={1} max={12} step={1} value={a.ownershipYears} onChange={(v) => set("ownershipYears", v)} />
          </Question>
        );
      case 4:
        return (
          <Question title="What body style?" hint="We'll only recommend cars that fit.">
            <Choice
              options={[
                { value: "any", label: "No preference", hint: "Show me the cheapest, whatever it is" },
                { value: "sedan", label: "Car / sedan", hint: "Sedans & hatchbacks" },
                { value: "suv", label: "SUV / crossover", hint: "More space & ground clearance" },
              ]}
              value={a.bodyStylePref}
              onChange={(v) => set("bodyStylePref", v as BodyStylePref)}
            />
          </Question>
        );
      case 5:
        return (
          <Question title="What's your budget?" hint="Sticker price ceiling for a new one (used will come in lower).">
            <Slider label={`Up to ${money(a.budgetMax)}`} min={18000} max={45000} step={1000} value={a.budgetMax} onChange={(v) => set("budgetMax", v)} />
          </Question>
        );
      case 6:
        return (
          <Question title="What matters most?" hint="How we break ties between good options.">
            <Choice
              options={[
                { value: "lowest_tco", label: "Lowest total cost", hint: "Cheapest to own, all-in" },
                { value: "best_efficiency", label: "Best fuel economy", hint: "Fewest gallons / kWh" },
                { value: "slowest_depreciation", label: "Holds value best", hint: "Strongest resale" },
                { value: "most_reliable", label: "Most reliable", hint: "Fewest recalls, best brand record" },
              ]}
              value={a.objective}
              onChange={(v) => set("objective", v as RecObjective)}
            />
          </Question>
        );
    }
  }
}

function Question({ title, hint, children }: { title: string; hint: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="mt-1 text-sm text-zinc-500">{hint}</p>
      </div>
      <div className="flex flex-col gap-4">{children}</div>
    </div>
  );
}

function Slider({ label, min, max, step, value, onChange }: { label: string; min: number; max: number; step: number; value: number; onChange: (v: number) => void }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm font-medium">{label}</span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-emerald-600" />
    </label>
  );
}

function Choice({ options, value, onChange }: { options: { value: string; label: string; hint: string }[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-col gap-2">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className={`flex flex-col rounded-xl border p-4 text-left transition-colors ${
              active
                ? "border-emerald-500 bg-emerald-500/10"
                : "border-zinc-200 hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
            }`}
          >
            <span className="font-medium">{o.label}</span>
            <span className="text-sm text-zinc-500">{o.hint}</span>
          </button>
        );
      })}
    </div>
  );
}

function Dashboard({
  rec,
  state,
  objective,
  onRestart,
}: {
  rec: Recommendation;
  state: string;
  objective: RecObjective;
  onRestart: () => void;
}) {
  const maxPt = Math.max(...rec.powertrainTotals.map((p) => p.total));
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-12">
      <div className="flex items-center justify-between">
        <Link href="/" className="text-sm font-bold tracking-tight">🚗 DriveWise</Link>
        <button onClick={onRestart} className="text-sm text-zinc-500 hover:underline">
          ↺ Adjust answers
        </button>
      </div>

      {/* Headline recommendation */}
      <section className="flex flex-col gap-4 rounded-2xl border border-emerald-500/40 bg-emerald-500/5 p-6">
        <span className="text-sm font-medium text-emerald-600">Our recommendation</span>
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <CarImage make={rec.model.make} model={rec.model.model} className="h-24 w-40 shrink-0 rounded-lg" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{rec.headline}</h1>
            <p className="mt-1 text-zinc-600 dark:text-zinc-300">
              {money(rec.acquisition[0].total)} all-in over {rec.modelResult.horizonYears} years ·{" "}
              {money(rec.acquisition[0].perMonth)}/mo
            </p>
          </div>
        </div>
        <ul className="flex flex-col gap-1.5 text-sm text-zinc-600 dark:text-zinc-300">
          {rec.rationale.map((r, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-emerald-600">✓</span>
              <span>{r}</span>
            </li>
          ))}
        </ul>
        <p className="text-xs text-zinc-500">
          Optimized for <strong>{OBJECTIVES[objective].toLowerCase()}</strong>.
          Hit “Adjust answers” to change your priority — e.g.{" "}
          {rec.objectiveHints.slice(0, 2).map((h, i) => (
            <span key={h.objective}>
              {i > 0 ? ", " : ""}
              {h.label} favors the <strong>{h.pick}</strong>
            </span>
          ))}
          .
        </p>
      </section>

      <p className="text-sm text-zinc-500">
        How we got there — the four decisions behind the pick. Click any to dig in.
      </p>

      <section className="grid gap-4 sm:grid-cols-2">
        {/* Powertrain */}
        <ModuleCard href="/powertrain" title="① Powertrain" verdict={`${PT_LABEL[rec.powertrainWinner]} wins`}>
          <div className="flex flex-col gap-1.5">
            {rec.powertrainTotals.map((p) => (
              <div key={p.powertrain} className="flex items-center gap-2 text-xs">
                <span className="w-14 text-zinc-500">{PT_LABEL[p.powertrain]}</span>
                <span className="h-2 flex-1 rounded bg-zinc-100 dark:bg-zinc-800">
                  <span className="block h-2 rounded bg-emerald-500/80" style={{ width: `${(p.total / maxPt) * 100}%` }} />
                </span>
                <span className="tabular-nums text-zinc-500">{money(p.total)}</span>
              </div>
            ))}
          </div>
        </ModuleCard>

        {/* Model */}
        <ModuleCard href="/model-picker" title="② Which model" verdict={`${rec.model.make} ${rec.model.model}`}>
          <p className="text-xs text-zinc-500">
            #1 pick · {rec.model.combinedMpg ?? "—"} mpg · {money(rec.model.msrp)} MSRP
          </p>
          <ul className="mt-1 text-xs text-zinc-500">
            {rec.modelAlternatives.map((alt) => (
              <li key={alt.vehicle.id}>
                vs {alt.vehicle.make} {alt.vehicle.model} — {money(alt.total)}
              </li>
            ))}
          </ul>
        </ModuleCard>

        {/* Own vs rideshare */}
        <ModuleCard href="/own-vs-rideshare" title="③ Own vs Uber" verdict={rec.rideshare.rideshareCheaper ? "Rideshare may win" : "Owning wins"}>
          <p className="text-xs text-zinc-500">
            Own {money(rec.rideshare.ownMonthly)}/mo · rideshare {money(rec.rideshare.rideMonthly)}/mo
          </p>
        </ModuleCard>

        {/* Acquisition */}
        <ModuleCard href="/acquisition" title="④ How to pay" verdict={`${rec.acquisition[0].label} is cheapest`}>
          <div className="flex flex-col gap-1 text-xs text-zinc-500">
            {rec.acquisition.map((o) => (
              <div key={o.key} className="flex justify-between">
                <span>{o.label}</span>
                <span className="tabular-nums">{money(o.total)}</span>
              </div>
            ))}
          </div>
        </ModuleCard>
      </section>

      <DealerFinder
        make={rec.model.make}
        model={rec.model.model}
        state={state}
      />

      <p className="text-xs text-zinc-400">
        Your answers are saved, so each detailed page above opens pre-filled with
        the same inputs. Prices are live where available, defaults otherwise.
      </p>
    </main>
  );
}

function ModuleCard({ href, title, verdict, children }: { href: string; title: string; verdict: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="group flex flex-col gap-2 rounded-xl border border-zinc-200 p-4 transition-colors hover:border-emerald-400 dark:border-zinc-800 dark:hover:border-emerald-600">
      <div className="flex items-baseline justify-between">
        <span className="text-xs font-medium text-zinc-400">{title}</span>
        <span className="text-xs text-emerald-600 opacity-0 transition-opacity group-hover:opacity-100">Explore →</span>
      </div>
      <p className="font-semibold">{verdict}</p>
      {children}
    </Link>
  );
}
