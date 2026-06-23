"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/powertrain", label: "Powertrain", hint: "Gas / hybrid / EV" },
  { href: "/own-vs-rideshare", label: "Own vs Uber", hint: "Car or rideshare" },
  { href: "/model-picker", label: "Models", hint: "Rank the shortlist" },
  { href: "/acquisition", label: "Lease / Buy", hint: "New, used, lease" },
];

export function DecisionNav() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-black/70">
      <nav className="mx-auto flex max-w-3xl items-center gap-1 overflow-x-auto px-3 py-2 text-sm">
        <Link
          href="/"
          className="mr-2 shrink-0 font-bold tracking-tight"
          aria-label="DriveWise home"
        >
          🚗 DriveWise
        </Link>
        {TABS.map((t) => {
          const active = pathname === t.href;
          return (
            <Link
              key={t.href}
              href={t.href}
              title={t.hint}
              className={`shrink-0 rounded-lg px-3 py-1.5 transition-colors ${
                active
                  ? "bg-emerald-600 text-white"
                  : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
              }`}
            >
              {t.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
