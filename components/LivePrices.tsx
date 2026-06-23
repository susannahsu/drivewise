import type { MarketData } from "@/lib/data/market";
import { moneyCents } from "@/lib/format";

function Badge({ label, live }: { label: string; live: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 px-2.5 py-1 dark:border-zinc-800">
      <span
        className={`inline-block h-1.5 w-1.5 rounded-full ${
          live ? "bg-emerald-500" : "bg-zinc-400"
        }`}
        aria-hidden
      />
      {label}
      <span className="text-zinc-400">{live ? "live" : "est."}</span>
    </span>
  );
}

/** Compact row of price chips, each flagged live (API) or est. (fallback). */
export function LivePrices({ market }: { market: MarketData }) {
  return (
    <div className="flex flex-wrap gap-2 text-xs text-zinc-500">
      <Badge
        label={`Gas ${moneyCents(market.gasPricePerGallon)}/gal`}
        live={market.live.gas}
      />
      <Badge
        label={`Electricity ${moneyCents(market.electricityPricePerKwh)}/kWh`}
        live={market.live.electricity}
      />
      <Badge
        label={`Loan ${(market.loanApr * 100).toFixed(1)}%`}
        live={market.live.loan}
      />
    </div>
  );
}
