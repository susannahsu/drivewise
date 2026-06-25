/** Lightweight loading placeholder shown while the first price fetch resolves. */
export function ResultsSkeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-4" aria-hidden>
      <div className="h-20 rounded-xl bg-zinc-100 dark:bg-zinc-800/60" />
      <div className="h-32 rounded-xl bg-zinc-100 dark:bg-zinc-800/60" />
      <div className="h-48 rounded-xl bg-zinc-100 dark:bg-zinc-800/60" />
    </div>
  );
}
