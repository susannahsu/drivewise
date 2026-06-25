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

/**
 * The shared driving-profile inputs, reused by every decision view. Uses the
 * same slider/toggle vocabulary as the guided flow so the standalone tools and
 * the wizard feel like one product — and sliders sidestep the leading-zero
 * quirk of bound number inputs.
 */
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
    <div className="flex flex-col gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-600 dark:text-zinc-400">State</span>
          <select
            className="rounded-lg border border-zinc-300 bg-transparent px-2 py-2 dark:border-zinc-700"
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

        <div className="flex flex-col justify-end">
          <span className="mb-1 text-sm text-zinc-600 dark:text-zinc-400">
            Charging
          </span>
          <div className="grid grid-cols-2 gap-2">
            {[
              { v: false, label: "No home charging" },
              { v: true, label: "Charge at home" },
            ].map((opt) => {
              const active = value.homeCharging === opt.v;
              return (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => set("homeCharging", opt.v)}
                  className={`rounded-lg border px-2 py-2 text-xs font-medium transition-colors ${
                    active
                      ? "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                      : "border-zinc-200 text-zinc-500 hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <ProfileSlider
        label={`${value.annualMiles.toLocaleString()} miles / year`}
        min={3000}
        max={30000}
        step={1000}
        value={value.annualMiles}
        onChange={(v) => set("annualMiles", v)}
      />
      <ProfileSlider
        label={`Keep it ${value.ownershipYears} ${value.ownershipYears === 1 ? "year" : "years"}`}
        min={1}
        max={15}
        step={1}
        value={value.ownershipYears}
        onChange={(v) => set("ownershipYears", v)}
      />
    </div>
  );
}

function ProfileSlider({
  label,
  min,
  max,
  step,
  value,
  onChange,
}: {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-emerald-600"
      />
    </label>
  );
}
