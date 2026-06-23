"use client";

import { useState, useSyncExternalStore } from "react";
import { US_STATES } from "@/lib/schema";

export interface ProfileFormState {
  state: string;
  annualMiles: number;
  ownershipYears: number;
  homeCharging: boolean;
}

export const DEFAULT_PROFILE: ProfileFormState = {
  state: "MA",
  annualMiles: 12000,
  ownershipYears: 5,
  homeCharging: false,
};

const STORAGE_KEY = "drivewise:profile";

export function loadProfile(): ProfileFormState {
  if (typeof window === "undefined") return DEFAULT_PROFILE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULT_PROFILE, ...JSON.parse(raw) } : DEFAULT_PROFILE;
  } catch {
    return DEFAULT_PROFILE;
  }
}

export function saveProfile(p: ProfileFormState): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  } catch {
    /* ignore quota / disabled storage */
  }
}

const noopSubscribe = () => () => {};

/**
 * Profile state hydrated from localStorage without an effect. useSyncExternalStore
 * returns the server snapshot (DEFAULT) during SSR + first client render so
 * hydration matches, then re-renders with the stored value — no hydration
 * mismatch and no setState-in-effect. Edits persist back to localStorage.
 */
export function useStoredProfile(): [
  ProfileFormState,
  (next: ProfileFormState) => void,
] {
  const isServer = useSyncExternalStore(
    noopSubscribe,
    () => false,
    () => true,
  );
  const [edited, setEdited] = useState<ProfileFormState | null>(null);
  const profile = edited ?? (isServer ? DEFAULT_PROFILE : loadProfile());

  const update = (next: ProfileFormState) => {
    setEdited(next);
    saveProfile(next);
  };
  return [profile, update];
}

/** The shared driving-profile inputs, reused by every decision view. */
export function ProfileFields({
  value,
  onChange,
}: {
  value: ProfileFormState;
  onChange: (next: ProfileFormState) => void;
}) {
  const set = <K extends keyof ProfileFormState>(
    key: K,
    v: ProfileFormState[K],
  ) => onChange({ ...value, [key]: v });

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-zinc-600 dark:text-zinc-400">State</span>
        <select
          className="rounded border border-zinc-300 bg-transparent px-2 py-1.5 dark:border-zinc-700"
          value={value.state}
          onChange={(e) => set("state", e.target.value)}
        >
          {US_STATES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-zinc-600 dark:text-zinc-400">Annual miles</span>
        <input
          type="number"
          min={1000}
          step={500}
          className="rounded border border-zinc-300 bg-transparent px-2 py-1.5 dark:border-zinc-700"
          value={value.annualMiles}
          onChange={(e) => set("annualMiles", Number(e.target.value))}
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-zinc-600 dark:text-zinc-400">
          Years you&apos;ll keep it
        </span>
        <input
          type="number"
          min={1}
          max={20}
          className="rounded border border-zinc-300 bg-transparent px-2 py-1.5 dark:border-zinc-700"
          value={value.ownershipYears}
          onChange={(e) => set("ownershipYears", Number(e.target.value))}
        />
      </label>

      <label className="flex items-center gap-2 self-end text-sm">
        <input
          type="checkbox"
          checked={value.homeCharging}
          onChange={(e) => set("homeCharging", e.target.checked)}
        />
        <span className="text-zinc-600 dark:text-zinc-400">
          I have home charging
        </span>
      </label>
    </div>
  );
}
