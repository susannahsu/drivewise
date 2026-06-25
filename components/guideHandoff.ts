/**
 * The extra context the guided flow collects beyond the driving profile —
 * the chosen objective, the recommended model, and the commute — persisted so
 * that clicking through to a detail page lands pre-filled with the same answers
 * (the profile itself rides along in `drivewise:profile`; see ProfileFields).
 */
export interface GuideHandoff {
  objective?: string;
  vehicleId?: string;
  oneWayMiles?: number;
  daysPerWeek?: number;
}

const KEY = "drivewise:guide";

export function saveGuideHandoff(h: GuideHandoff): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(h));
  } catch {
    /* ignore quota / disabled storage */
  }
}

export function loadGuideHandoff(): GuideHandoff {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as GuideHandoff) : {};
  } catch {
    return {};
  }
}
