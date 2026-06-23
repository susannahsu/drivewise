import { money } from "@/lib/format";

export interface ChartSeries {
  label: string;
  color: string;
  /** Cumulative cost at the end of year 1..N. */
  values: number[];
}

const W = 640;
const H = 340;
const PAD = { top: 16, right: 16, bottom: 36, left: 64 };

/**
 * Dependency-free SVG line chart of cumulative cost over the ownership horizon.
 * The lowest line at any year is the cheapest option by then; where lines cross
 * is the break-even point — the whole persuasion of the tool in one picture.
 */
export function BreakEvenChart({ series }: { series: ChartSeries[] }) {
  const years = Math.max(...series.map((s) => s.values.length));
  const maxY = Math.max(...series.flatMap((s) => s.values), 1);

  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;
  const x = (yearIndex: number) =>
    PAD.left + (years <= 1 ? 0 : (yearIndex / (years - 1)) * plotW);
  const y = (val: number) => PAD.top + plotH - (val / maxY) * plotH;

  const yTicks = 4;
  const tickVals = Array.from({ length: yTicks + 1 }, (_, i) => (maxY / yTicks) * i);

  return (
    <figure className="flex flex-col gap-2">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        role="img"
        aria-label="Cumulative cost of ownership by year"
      >
        {/* y gridlines + labels */}
        {tickVals.map((tv, i) => (
          <g key={i}>
            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={y(tv)}
              y2={y(tv)}
              className="stroke-zinc-200 dark:stroke-zinc-800"
              strokeWidth={1}
            />
            <text
              x={PAD.left - 8}
              y={y(tv) + 4}
              textAnchor="end"
              className="fill-zinc-400 text-[10px]"
            >
              {money(tv)}
            </text>
          </g>
        ))}

        {/* x labels (years) */}
        {Array.from({ length: years }, (_, i) => (
          <text
            key={i}
            x={x(i)}
            y={H - PAD.bottom + 18}
            textAnchor="middle"
            className="fill-zinc-400 text-[10px]"
          >
            Yr {i + 1}
          </text>
        ))}

        {/* series lines + end dots */}
        {series.map((s) => {
          const pts = s.values.map((v, i) => `${x(i)},${y(v)}`).join(" ");
          return (
            <g key={s.label}>
              <polyline
                points={pts}
                fill="none"
                stroke={s.color}
                strokeWidth={2.5}
                strokeLinejoin="round"
              />
              {s.values.map((v, i) => (
                <circle key={i} cx={x(i)} cy={y(v)} r={2.5} fill={s.color} />
              ))}
            </g>
          );
        })}
      </svg>

      <figcaption className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
        {series.map((s) => (
          <span key={s.label} className="flex items-center gap-1.5">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: s.color }}
            />
            {s.label}
          </span>
        ))}
      </figcaption>
    </figure>
  );
}

export const SERIES_COLORS = ["#10b981", "#6366f1", "#f59e0b", "#ef4444"];
