"use client";

import { useMemo, useState } from "react";
import { rateDeal, type Grade } from "@/lib/deal";
import { money } from "@/lib/format";

const GRADE_STYLE: Record<Grade, { ring: string; chip: string; dot: string }> = {
  great: {
    ring: "border-emerald-500/50 bg-emerald-500/5",
    chip: "bg-emerald-600 text-white",
    dot: "text-emerald-600",
  },
  fair: {
    ring: "border-amber-500/50 bg-amber-500/5",
    chip: "bg-amber-500 text-white",
    dot: "text-amber-600",
  },
  walk_away: {
    ring: "border-red-500/50 bg-red-500/5",
    chip: "bg-red-600 text-white",
    dot: "text-red-600",
  },
};

const REASON_ICON: Record<Grade, string> = {
  great: "✓",
  fair: "→",
  walk_away: "✕",
};

/**
 * "Is this a good deal?" — enter the actual dealer offer for a model and get a
 * good / fair / walk-away verdict against MSRP and the live going loan rate.
 */
export function DealRater({
  msrp,
  marketApr,
}: {
  msrp: number;
  marketApr: number;
}) {
  const [quotedPrice, setQuotedPrice] = useState(msrp);
  const [offeredApr, setOfferedApr] = useState(
    Number((marketApr * 100).toFixed(1)),
  );
  const [termMonths, setTermMonths] = useState(60);
  const [downPayment, setDownPayment] = useState(Math.round(msrp * 0.1));

  const verdict = useMemo(
    () =>
      rateDeal({
        msrp,
        quotedPrice,
        offeredApr: offeredApr / 100,
        marketApr,
        termMonths,
        downPayment,
      }),
    [msrp, quotedPrice, offeredApr, marketApr, termMonths, downPayment],
  );

  const style = GRADE_STYLE[verdict.grade];
  const field =
    "rounded-lg border border-zinc-300 bg-transparent px-2 py-1.5 text-sm dark:border-zinc-700";

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-zinc-200 p-5 dark:border-zinc-800">
      <div>
        <h2 className="font-semibold">Rate my deal</h2>
        <p className="text-xs text-zinc-500">
          Got a quote? Enter it and see if it&apos;s fair — against MSRP and
          today&apos;s going loan rate ({(marketApr * 100).toFixed(1)}%).
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-600 dark:text-zinc-400">
            Quoted price (before tax/fees)
          </span>
          <input
            type="number"
            min={1000}
            step={250}
            value={quotedPrice}
            onChange={(e) => setQuotedPrice(Number(e.target.value))}
            className={field}
          />
          <span className="text-xs text-zinc-400">MSRP {money(msrp)}</span>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-600 dark:text-zinc-400">Offered APR %</span>
          <input
            type="number"
            min={0}
            max={30}
            step={0.1}
            value={offeredApr}
            onChange={(e) => setOfferedApr(Number(e.target.value))}
            className={field}
          />
          <span className="text-xs text-zinc-400">
            Going rate {(marketApr * 100).toFixed(1)}%
          </span>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-600 dark:text-zinc-400">Down payment</span>
          <input
            type="number"
            min={0}
            step={500}
            value={downPayment}
            onChange={(e) => setDownPayment(Number(e.target.value))}
            className={field}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-600 dark:text-zinc-400">Loan term</span>
          <select
            value={termMonths}
            onChange={(e) => setTermMonths(Number(e.target.value))}
            className={field}
          >
            {[36, 48, 60, 72, 84].map((m) => (
              <option key={m} value={m}>
                {m} months
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className={`flex flex-col gap-3 rounded-xl border p-4 ${style.ring}`}>
        <div className="flex flex-wrap items-center gap-3">
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${style.chip}`}
          >
            {verdict.grade.replace("_", " ")}
          </span>
          <span className="font-semibold">{verdict.headline}</span>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
          <span className="text-zinc-500">
            Payment{" "}
            <span className="font-semibold text-zinc-800 dark:text-zinc-200">
              {money(verdict.monthlyPayment)}/mo
            </span>
          </span>
          <span className="text-zinc-500">
            Total interest{" "}
            <span className="font-semibold text-zinc-800 dark:text-zinc-200">
              {money(verdict.totalInterest)}
            </span>
          </span>
          <span className="text-zinc-500">
            Fair price target{" "}
            <span className="font-semibold text-zinc-800 dark:text-zinc-200">
              {money(verdict.fairPriceTarget)}
            </span>
          </span>
        </div>
        <ul className="flex flex-col gap-1.5 text-sm">
          {verdict.reasons.map((r, i) => (
            <li key={i} className="flex gap-2">
              <span className={GRADE_STYLE[r.grade].dot}>
                {REASON_ICON[r.grade]}
              </span>
              <span className="text-zinc-600 dark:text-zinc-300">{r.text}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
