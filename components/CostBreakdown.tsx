import type { TcoResult } from "@/lib/schema";
import { BREAKDOWN_LABELS, money } from "@/lib/format";

/** Horizontal stacked-ish bars showing where the total cost goes. */
export function CostBreakdown({ result }: { result: TcoResult }) {
  const entries = Object.entries(result.breakdown)
    .filter(([, v]) => Math.abs(v) > 0.5)
    .sort((a, b) => b[1] - a[1]);
  const max = Math.max(...entries.map(([, v]) => v), 1);

  return (
    <div className="flex flex-col gap-2">
      {entries.map(([key, value]) => (
        <div key={key} className="grid grid-cols-[10rem_1fr_5rem] items-center gap-3 text-sm">
          <span className="text-zinc-600 dark:text-zinc-400">
            {BREAKDOWN_LABELS[key] ?? key}
          </span>
          <span className="h-3 rounded bg-zinc-100 dark:bg-zinc-800">
            <span
              className="block h-3 rounded bg-emerald-500/80"
              style={{ width: `${(value / max) * 100}%` }}
            />
          </span>
          <span className="text-right tabular-nums">{money(value)}</span>
        </div>
      ))}
    </div>
  );
}
