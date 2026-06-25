import type { UsState, Vehicle } from "@/lib/schema";
import { estimateAnnualInsurance } from "@/lib/tco/insurance";
import { evIncentive } from "@/lib/tco/incentives";
import {
  ANNUAL_REGISTRATION,
  MAINTENANCE_PER_MILE,
  OPPORTUNITY_COST_RATE,
  PUBLIC_CHARGING_MULTIPLIER,
  RESALE_RATIO_5YR,
  vehicleSalesTaxRate,
} from "@/lib/tco/defaults";
import { money, moneyCents } from "@/lib/format";

/**
 * Inline "show the assumptions" disclosure. Surfaces the estimated, slow-moving
 * inputs behind a TCO number right at the point of the claim, so a skeptical
 * buyer can audit *why* the figure is what it is rather than taking it on faith.
 */
export function Assumptions({
  vehicle,
  state,
  loanApr,
  homeCharging,
  incentiveApplied = false,
}: {
  vehicle: Vehicle;
  state: UsState;
  loanApr: number;
  homeCharging: boolean;
  incentiveApplied?: boolean;
}) {
  const resaleRatio = vehicle.resaleRatio5yr ?? RESALE_RATIO_5YR[vehicle.bodyStyle];
  const insurance = estimateAnnualInsurance(vehicle.bodyStyle, state);
  const maintPerMile = MAINTENANCE_PER_MILE[vehicle.powertrain];
  const taxRate = vehicleSalesTaxRate(state);
  const incentive = incentiveApplied ? evIncentive(vehicle, state) : null;

  const rows: { label: string; value: string; note?: string }[] = [
    {
      label: "Resale value",
      value: `${Math.round(resaleRatio * 100)}% of MSRP at 5 yrs`,
      note: "iSeeCars 2026 study; depreciation = price − resale",
    },
    {
      label: "Insurance",
      value: `${money(insurance)}/yr`,
      note: `full coverage, ${vehicle.bodyStyle.replace("_", " ")} × ${state} rate`,
    },
    {
      label: "Maintenance",
      value: `${moneyCents(maintPerMile)}/mi`,
      note: "rises ~8%/yr with age (AAA / CarEdge)",
    },
    {
      label: "Loan APR",
      value: `${(loanApr * 100).toFixed(1)}%`,
      note: "live FRED 48-mo new-car rate; 10% down, 60-mo term",
    },
    {
      label: "Sales tax",
      value: `${(taxRate * 100).toFixed(2)}%`,
      note: `${state} + ${money(ANNUAL_REGISTRATION)}/yr registration`,
    },
    {
      label: "Opportunity cost",
      value: `${(OPPORTUNITY_COST_RATE * 100).toFixed(0)}%/yr`,
      note: "forgone return on capital tied up in the car",
    },
    {
      label: "Energy",
      value: vehicle.combinedMpg
        ? `${vehicle.combinedMpg} mpg (EPA)`
        : `${vehicle.kwhPer100mi ?? "—"} kWh/100mi (EPA)`,
      note:
        vehicle.powertrain === "ev" || vehicle.powertrain === "phev"
          ? homeCharging
            ? "charged at home (residential rate)"
            : `no home charging → ${PUBLIC_CHARGING_MULTIPLIER}× residential rate`
          : "live state gas price",
    },
  ];

  if (incentive && incentive.total > 0) {
    rows.push({
      label: "EV incentive",
      value: `−${money(incentive.total)}`,
      note: `${money(incentive.federal)} federal${incentive.state > 0 ? ` + ${money(incentive.state)} ${state}` : ""}, netted off price`,
    });
  }

  return (
    <details className="group mt-3 text-xs">
      <summary className="cursor-pointer list-none text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
        <span className="inline-block transition-transform group-open:rotate-90">
          ▸
        </span>{" "}
        Show the assumptions
      </summary>
      <dl className="mt-2 grid grid-cols-1 gap-x-6 gap-y-1.5 sm:grid-cols-2">
        {rows.map((r) => (
          <div key={r.label} className="flex flex-col border-t border-zinc-100 pt-1.5 dark:border-zinc-800">
            <div className="flex justify-between gap-2">
              <dt className="text-zinc-500">{r.label}</dt>
              <dd className="tabular-nums font-medium">{r.value}</dd>
            </div>
            {r.note && <p className="text-zinc-400">{r.note}</p>}
          </div>
        ))}
      </dl>
      <p className="mt-2 text-zinc-400">
        These are documented defaults — override insurance with a real quote and
        the rest with your own figures for an exact number.
      </p>
    </details>
  );
}
