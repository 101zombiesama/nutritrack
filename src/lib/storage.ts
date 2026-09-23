import type { AppData } from "./types";
import { createSeedData } from "./seed";

export const STORAGE_KEY = "nutritrack:data:v1";
export const THEME_KEY = "nutritrack:theme";

function isBrowser() {
  return typeof window !== "undefined";
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
