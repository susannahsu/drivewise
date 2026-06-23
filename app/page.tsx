import Link from "next/link";

const DECISIONS = [
  {
    href: "/powertrain",
    tag: "US-1",
    title: "Hybrid, gas, or electric?",
    blurb:
      "Live electricity & gas prices for your state, your real mileage, no-home-charging math.",
  },
  {
    href: "/own-vs-rideshare",
    tag: "US-2",
    title: "Own a car, or just Uber?",
    blurb:
      "Your actual commute routes and times vs the fixed cost of owning a car that sits idle.",
  },
  {
    href: "/model-picker",
    tag: "US-3",
    title: "Which brand & model?",
    blurb:
      "Rank candidates by lowest cost, reliability, depreciation, or a weighted mix.",
  },
  {
    href: "/acquisition",
    tag: "US-4",
    title: "Lease, buy new, or buy used?",
    blurb:
      "Depreciation curves, current loan rates, and how long you plan to keep it.",
  },
];

export default function Home() {
  return (
    <main className="mx-auto flex max-w-3xl flex-1 flex-col gap-10 px-6 py-16">
      <header className="flex flex-col gap-3">
        <h1 className="text-4xl font-bold tracking-tight">DriveWise</h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-300">
          The mathematically cheapest way to meet your driving needs — not the
          prettiest car, the <em>optimal</em> one. Every answer is one Total Cost
          of Ownership engine, fed with live prices.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2">
        {DECISIONS.map((d) => (
          <Link
            key={d.href}
            href={d.href}
            className="group rounded-xl border border-zinc-200 p-5 transition-colors hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
          >
            <span className="font-mono text-xs text-zinc-400">{d.tag}</span>
            <h2 className="mt-1 text-lg font-semibold group-hover:underline">
              {d.title}
            </h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              {d.blurb}
            </p>
          </Link>
        ))}
      </section>

      <footer className="text-sm text-zinc-500">
        Planning phase — see{" "}
        <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">
          docs/SPEC.md
        </code>
        . Decision pages are stubs until Phase 2.
      </footer>
    </main>
  );
}
