import type { GoalProgress } from "./nutrition";
import type { Units } from "./types";

const NUMBER = new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 });
const ONE_DP = new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 });

export function formatNumber(value: number): string {
  return NUMBER.format(Math.round(value));
}

export function formatKcal(value: number): string {
  return `${formatNumber(value)} kcal`;
}

export function formatGrams(value: number): string {
  return `${formatNumber(value)}g`;
}

export function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}

export function formatDecimal(value: number, digits = 1): string {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: digits }).format(value);
}

/**
 * Non-judgemental status copy. A "limit" goal reads as headroom left, a
 * "target" goal reads as distance still to go.
 */
export function progressCopy(progress: GoalProgress, unit: "g" | "kcal"): string {
  const suffix = unit === "g" ? "g" : " kcal";
  const format = (n: number) => `${formatNumber(n)}${suffix}`;

  if (progress.goal <= 0) return "No goal set";
  if (progress.over > 0) return `${format(progress.over)} over`;
  if (progress.state === "met") return "Goal reached";
  if (progress.consumed <= 0) {
    return progress.mode === "limit" ? `${format(progress.goal)} available` : `${format(progress.goal)} to go`;
  }
  return progress.mode === "limit"
    ? `${format(progress.remaining)} remaining`
    : `${format(progress.remaining)} to go`;
}

/* ---------- units ---------- */

export const KG_PER_LB = 0.45359237;
export const CM_PER_INCH = 2.54;

export function kgToLb(kg: number): number {
  return kg / KG_PER_LB;
}

export function lbToKg(lb: number): number {
  return lb * KG_PER_LB;
}

export function cmToFeetInches(cm: number): { feet: number; inches: number } {
  const totalInches = Math.round(cm / CM_PER_INCH);
  return { feet: Math.floor(totalInches / 12), inches: totalInches % 12 };
}

export function feetInchesToCm(feet: number, inches: number): number {
  return (feet * 12 + inches) * CM_PER_INCH;
}

export function weightUnitLabel(units: Units): string {
  return units === "metric" ? "kg" : "lb";
}

export function displayWeight(kg: number, units: Units): number {
  return units === "metric" ? kg : kgToLb(kg);
}

export function formatWeight(kg: number, units: Units): string {
  const value = displayWeight(kg, units);
  return `${formatDecimal(value, 1)} ${weightUnitLabel(units)}`;
}

export function formatHeight(cm: number, units: Units): string {
  if (units === "metric") return `${formatNumber(cm)} cm`;
  const { feet, inches } = cmToFeetInches(cm);
  return `${feet}' ${inches}"`;
}

export function parseNumber(value: string): number | null {
  const cleaned = value.replace(/[^0-9.\-]/g, "");
  if (cleaned === "" || cleaned === "-" || cleaned === ".") return null;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

export { ONE_DP };
