import { useEffect, useRef } from "react";

/**
 * Run `fn` exactly once after the component mounts. Used by the decision pages
 * to fetch live prices and compute a result immediately on load — so a page
 * never lands on a blank "click to compute" state — while staying resilient to
 * React 18 StrictMode's double-invoke in dev via the ref guard.
 */
export function useAutoRun(fn: () => void): void {
  const ran = useRef(false);
  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    fn();
    // Intentionally mount-only: `fn` closes over the stored profile, which is
    // already resolved on the first client render (useSyncExternalStore).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
