import {
  type DrivingProfile,
  type TcoResult,
  type UsState,
  type Vehicle,
} from "@/lib/schema";
import { computeTco, type MarketInputs } from "@/lib/tco";
import { resaleValueAtAge } from "@/lib/tco/depreciation";
import { REPRESENTATIVE_VEHICLES } from "@/lib/models/representative";
import { SEED_VEHICLES } from "@/lib/models/seed";
import { RESALE_RATIO_5YR } from "@/lib/tco/defaults";
import {
  DEFAULT_FARE_MODEL,
  monthlyRideshareCost,
} from "@/lib/data/rideshare-model";

export type RecObjective =
  | "lowest_tco"
  | "best_efficiency"
  | "slowest_depreciation";

export type BodyStylePref = "any" | "sedan" | "suv";

export interface GuideAnswers {
  state: UsState;
  homeCharging: boolean;
  /** Commute, used for the own-vs-rideshare check. */
  oneWayMiles: number;
  daysPerWeek: number;
  /** Total annual driving (commute + everything else). */
  annualMiles: number;
  ownershipYears: number;
  bodyStylePref: BodyStylePref;
  budgetMax: number;
  objective: RecObjective;
}

const USED_AGE_YEARS = 3;

const SEDAN_STYLES = ["subcompact", "compact", "midsize"];
const SUV_STYLES = ["subcompact_suv", "compact_suv", "midsize_suv"];

function matchesBody(v: Vehicle, pref: BodyStylePref): boolean {
  if (pref === "any") return true;
  return (pref === "sedan" ? SEDAN_STYLES : SUV_STYLES).includes(v.bodyStyle);
}

function profileFor(a: GuideAnswers, annualMiles: number): DrivingProfile {
  return {
    state: a.state,
    homeCharging: a.homeCharging,
    annualMiles: Math.max(1000, annualMiles),
    ownershipYears: Math.max(1, Math.round(a.ownershipYears)),
    routes: [],
  };
}

export interface AcquisitionPick {
  key: "finance_new" | "buy_used" | "lease";
  label: string;
  total: number;
  perMonth: number;
}

export interface Recommendation {
  powertrainWinner: "gas" | "hybrid" | "ev";
  powertrainTotals: { powertrain: string; total: number }[];
  model: Vehicle;
  modelResult: TcoResult;
  modelAlternatives: { vehicle: Vehicle; total: number }[];
  acquisition: AcquisitionPick[]; // cheapest first
  rideshare: {
    ownMonthly: number;
    rideMonthly: number;
    rideshareCheaper: boolean;
  };
  headline: string;
  rationale: string[];
}

const PT_LABEL: Record<string, string> = {
  gas: "gas",
  hybrid: "hybrid",
  ev: "electric",
};
const ACQ_LABEL: Record<AcquisitionPick["key"], string> = {
  finance_new: "finance it new",
  buy_used: "buy it lightly used",
  lease: "lease it",
};

export function recommend(
  a: GuideAnswers,
  market: MarketInputs,
): Recommendation {
  const profile = profileFor(a, a.annualMiles);

  // 1) Powertrain — representative gas / hybrid / EV.
  const ptRows = REPRESENTATIVE_VEHICLES.map((v) => ({
    powertrain: v.powertrain,
    total: computeTco(v, profile, market).total,
  })).sort((x, y) => x.total - y.total);
  const powertrainWinner = ptRows[0].powertrain as "gas" | "hybrid" | "ev";

  // 2) Best model — eligible by body style + budget, ranked by objective.
  const eligible = SEED_VEHICLES.filter(
    (v) => matchesBody(v, a.bodyStylePref) && v.msrp <= a.budgetMax,
  );
  const pool = eligible.length ? eligible : SEED_VEHICLES;
  const ranked = pool
    .map((vehicle) => ({
      vehicle,
      result: computeTco(vehicle, profile, market),
      resaleRatio:
        vehicle.resaleRatio5yr ?? RESALE_RATIO_5YR[vehicle.bodyStyle],
    }))
    .sort((x, y) => {
      switch (a.objective) {
        case "lowest_tco":
          return x.result.total - y.result.total;
        case "best_efficiency":
          return (y.vehicle.combinedMpg ?? 0) - (x.vehicle.combinedMpg ?? 0);
        case "slowest_depreciation":
          return y.resaleRatio - x.resaleRatio;
      }
    });
  const top = ranked[0];

  // 3) Acquisition for the picked model.
  const usedPrice = Math.round(resaleValueAtAge(top.vehicle, USED_AGE_YEARS));
  const acquisition: AcquisitionPick[] = [
    {
      key: "finance_new",
      label: "Finance new",
      ...money(computeTco(top.vehicle, profile, market, { mode: "finance" })),
    },
    {
      key: "buy_used",
      label: `Buy used (~${USED_AGE_YEARS}yr)`,
      ...money(
        computeTco(top.vehicle, profile, market, {
          mode: "finance",
          purchasePrice: usedPrice,
          startAgeYears: USED_AGE_YEARS,
        }),
      ),
    },
    {
      key: "lease",
      label: "Lease",
      ...money(computeTco(top.vehicle, profile, market, { mode: "lease" })),
    },
  ].sort((x, y) => x.total - y.total);

  // 4) Own vs rideshare for the commute.
  const ownMonthly = top.result.perMonth;
  const rideMonthly = monthlyRideshareCost(
    {
      oneWayMiles: a.oneWayMiles,
      daysPerWeek: a.daysPerWeek,
      departTime: "08:00",
      returnTime: "17:30",
    },
    DEFAULT_FARE_MODEL,
  );
  const rideshareCheaper = rideMonthly < ownMonthly;

  // Synthesize.
  const bestAcq = acquisition[0];
  const headline = rideshareCheaper
    ? `At your mileage, rideshare may beat owning — but if you buy, ${ACQ_LABEL[bestAcq.key]} a ${top.vehicle.make} ${top.vehicle.model}`
    : `${capitalize(ACQ_LABEL[bestAcq.key])} a ${top.vehicle.make} ${top.vehicle.model}`;

  const rationale = [
    `Cheapest powertrain for your driving: ${PT_LABEL[powertrainWinner]}${
      !a.homeCharging && powertrainWinner !== "ev"
        ? " (no home charging makes a full EV hard to justify)"
        : ""
    }.`,
    `${top.vehicle.make} ${top.vehicle.model} ranks #1 of ${pool.length} eligible models for "${objectiveLabel(a.objective)}" — ${top.vehicle.combinedMpg ?? "—"} mpg, ${Math.round(top.resaleRatio * 100)}% resale, ${moneyStr(top.result.total)} over ${profile.ownershipYears} yrs.`,
    `${bestAcq.label} is the cheapest way to pay: ${moneyStr(bestAcq.total)} (${moneyStr(bestAcq.perMonth)}/mo).`,
    rideshareCheaper
      ? `You drive little enough (${a.daysPerWeek} commute days/wk) that rideshare (${moneyStr(rideMonthly)}/mo) undercuts owning (${moneyStr(ownMonthly)}/mo) — worth a hard look before buying.`
      : `Owning (${moneyStr(ownMonthly)}/mo) beats rideshare (${moneyStr(rideMonthly)}/mo) at your commute.`,
  ];

  return {
    powertrainWinner,
    powertrainTotals: ptRows.map((r) => ({
      powertrain: r.powertrain,
      total: r.total,
    })),
    model: top.vehicle,
    modelResult: top.result,
    modelAlternatives: ranked
      .slice(1, 4)
      .map((r) => ({ vehicle: r.vehicle, total: r.result.total })),
    acquisition,
    rideshare: { ownMonthly, rideMonthly, rideshareCheaper },
    headline,
    rationale,
  };
}

function money(r: TcoResult): { total: number; perMonth: number } {
  return { total: r.total, perMonth: r.perMonth };
}
function moneyStr(n: number): string {
  return `$${Math.round(n).toLocaleString()}`;
}
function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
function objectiveLabel(o: RecObjective): string {
  return o === "lowest_tco"
    ? "lowest total cost"
    : o === "best_efficiency"
      ? "best efficiency"
      : "holds value best";
}
