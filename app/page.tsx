import Link from "next/link";

const DECISIONS = [
  {
    href: "/powertrain",
    icon: "⛽",
    title: "Hybrid, gas, or electric?",
    blurb:
      "Live gas & electricity prices for your state, your real mileage, and honest no-home-charging math.",
  },
  {
    href: "/own-vs-rideshare",
    icon: "🚕",
    title: "Own a car, or just Uber?",
    blurb:
      "Your real commute (with rush-hour surge) vs the fixed monthly cost of owning a car that sits idle.",
  },
  {
    href: "/model-picker",
    icon: "🚙",
    title: "Which car should we buy?",
    blurb:
      "The 20-car best-value shortlist, ranked for you — with real EPA mileage and photos.",
  },
  {
    href: "/acquisition",
    icon: "🏷️",
    title: "Lease, buy new, or buy used?",
    blurb:
      "Three ways to pay for the same car, compared over how long you'll actually keep it.",
  },
];

const STEPS = [
  ["1", "Pick a question", "Each one is its own page."],
  ["2", "Set your details once", "State, mileage, and years are remembered across all four."],
  ["3", "Drag the sliders", "Watch the cheapest answer change as gas, miles, and time shift."],
];

export default function Home() {
  return (
    <main className="mx-auto flex max-w-3xl flex-1 flex-col gap-10 px-6 py-16">
      <header className="flex flex-col gap-3">
        <h1 className="text-4xl font-bold tracking-tight">🚗 DriveWise</h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-300">
          The mathematically cheapest way to meet your driving needs — not the
          prettiest car, the <em>optimal</em> one. Four decisions, one cost
          engine, fed with live prices.
        </p>
      </header>

      <section className="grid gap-3 rounded-xl border border-zinc-200 p-5 dark:border-zinc-800 sm:grid-cols-3">
        {STEPS.map(([n, title, hint]) => (
          <div key={n} className="flex flex-col gap-1">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
              {n}
            </span>
            <p className="text-sm font-medium">{title}</p>
            <p className="text-xs text-zinc-500">{hint}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        {DECISIONS.map((d) => (
          <Link
            key={d.href}
            href={d.href}
            className="group flex flex-col gap-1 rounded-xl border border-zinc-200 p-5 transition-colors hover:border-emerald-400 hover:bg-emerald-500/5 dark:border-zinc-800 dark:hover:border-emerald-600"
          >
            <span className="text-2xl">{d.icon}</span>
            <h2 className="mt-1 text-lg font-semibold group-hover:text-emerald-600">
              {d.title}
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">{d.blurb}</p>
          </Link>
        ))}
      </section>

      <footer className="text-sm text-zinc-500">
        Prices are pulled live where available and fall back to sane defaults
        otherwise — every number is editable, so you can plug in your own quotes.
      </footer>
    </main>
  );
}
