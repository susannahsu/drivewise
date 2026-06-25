import { useEffect, useRef, useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};

/**
 * False during SSR and the first (hydration) client render, then true. Lets a
 * page wait until localStorage-backed state (the stored profile / guide handoff)
 * has actually resolved before acting on it — the values read on the very first
 * render are still defaults.
 */
export function useHydrated(): boolean {
  return !useSyncExternalStore(
    noopSubscribe,
    () => false,
    () => true,
  );
}

/**
 * Run `fn` exactly once, as soon as `ready` is true, after the component mounts.
 * Used by the decision pages to fetch live prices and compute a result on load —
 * so a page never lands on a blank "click to compute" state. Gating on `ready`
 * (typically `useHydrated()`) ensures `fn` captures the resolved stored profile
 * rather than the pre-hydration defaults. The ref guard keeps it to one run even
 * as `fn`'s identity changes across renders.
 */
export function useAutoRun(fn: () => void, ready: boolean = true): void {
  const ran = useRef(false);
  useEffect(() => {
    if (ran.current || !ready) return;
    ran.current = true;
    fn();
  }, [ready, fn]);
}
