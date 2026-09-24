import type { AppData } from "./types";
import { todayISO } from "./dates";
import { createSeedData } from "./seed";

export const STORAGE_KEY = "nutritrack:data:v1";
export const THEME_KEY = "nutritrack:theme";

function isBrowser() {
  return typeof window !== "undefined";
}

/**
 * The demo dataset pins "today" to the day it was generated, so a browser that
 * seeded yesterday would open on an empty Today screen. Regenerate it for the
 * current day - but only while it is still the demo: the moment the user logs
 * something of their own, `demo` flips off and the data is never touched.
 */
function isStaleDemo(data: AppData): boolean {
  return data.demo !== false && data.seededOn !== todayISO();
}

/** Shallow sanity check - a corrupted or out-of-date blob is replaced by seed data. */
function isValid(data: unknown): data is AppData {
  if (!data || typeof data !== "object") return false;
  const candidate = data as Partial<AppData>;
  return (
    Array.isArray(candidate.meals) &&
    Array.isArray(candidate.weights) &&
    typeof candidate.profile === "object" &&
    typeof candidate.goals === "object"
  );
}

export function loadData(): AppData {
  if (!isBrowser()) return createSeedData();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seeded = createSeedData();
      saveData(seeded);
      return seeded;
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!isValid(parsed)) throw new Error("invalid shape");
    if (isStaleDemo(parsed)) {
      const seeded = createSeedData();
      saveData(seeded);
      return seeded;
    }
    return { ...createSeedData(), ...parsed, version: 1 } as AppData;
  } catch {
    const seeded = createSeedData();
    saveData(seeded);
    return seeded;
  }
}

export function saveData(data: AppData): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Storage full or blocked (private mode) - the app keeps working in memory.
  }
}

export function clearData(): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function readStoredTheme(): string | null {
  if (!isBrowser()) return null;
  try {
    return window.localStorage.getItem(THEME_KEY);
  } catch {
    return null;
  }
}

export function writeStoredTheme(theme: string): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(THEME_KEY, theme);
  } catch {
    // ignore
  }
}
