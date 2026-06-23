import Link from "next/link";

/** Shared placeholder for the four decision views until Phase 2 builds them. */
export function DecisionStub({
  tag,
  title,
  summary,
}: {
  tag: string;
  title: string;
  summary: string;
}) {
  return (
    <main className="mx-auto flex max-w-2xl flex-1 flex-col gap-6 px-6 py-16">
      <Link href="/" className="text-sm text-zinc-500 hover:underline">
        ← all decisions
      </Link>
      <div>
        <span className="font-mono text-xs text-zinc-400">{tag}</span>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">{title}</h1>
      </div>
      <p className="text-zinc-600 dark:text-zinc-300">{summary}</p>
      <div className="rounded-lg border border-dashed border-zinc-300 p-5 text-sm text-zinc-500 dark:border-zinc-700">
        Not built yet. This view lands in <strong>Phase 2</strong>, on top of the
        shared TCO engine (Phase 1). See <code>docs/SPEC.md</code>.
      </div>
    </main>
  );
}
