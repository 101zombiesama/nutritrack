"use client";

import { formatGrams, formatPercent } from "@/lib/format";
import { MACRO_LABELS, macroDistribution } from "@/lib/nutrition";
import type { MacroKey, NutritionTotals } from "@/lib/types";
import styles from "./MacroDonut.module.css";

const COLORS: Record<MacroKey, string> = {
  protein: "var(--protein)",
  carbs: "var(--carbs)",
  fat: "var(--fat)",
};

const SIZE = 168;
const STROKE = 22;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function MacroDonut({ totals }: { totals: NutritionTotals }) {
  const distribution = macroDistribution(totals);
  const keys: MacroKey[] = ["protein", "carbs", "fat"];
  const hasData = distribution.protein + distribution.carbs + distribution.fat > 0;

  let offset = 0;

  return (
    <div className={styles.wrap}>
      <div className={styles.chart}>
        <svg
          className={styles.svg}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          role="img"
          aria-label={
            hasData
              ? `Calorie split: protein ${formatPercent(distribution.protein)}, carbs ${formatPercent(
                  distribution.carbs,
                )}, fat ${formatPercent(distribution.fat)}`
              : "No macro data yet"
          }
        >
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="var(--track)"
            strokeWidth={STROKE}
          />
          {hasData
            ? keys.map((key) => {
                const share = distribution[key] / 100;
                const length = CIRCUMFERENCE * share;
                const segment = (
                  <circle
                    key={key}
                    cx={SIZE / 2}
                    cy={SIZE / 2}
                    r={RADIUS}
                    fill="none"
                    stroke={COLORS[key]}
                    strokeWidth={STROKE}
                    strokeDasharray={`${Math.max(0, length - 2)} ${CIRCUMFERENCE - Math.max(0, length - 2)}`}
                    strokeDashoffset={-offset}
                  />
                );
                offset += length;
                return segment;
              })
            : null}
        </svg>
        <div className={styles.center}>
          <span className={styles.centerValue}>
            {hasData ? formatPercent(distribution.carbs) : "--"}
          </span>
          <span className={styles.centerLabel}>from carbs</span>
        </div>
      </div>

      <div className={styles.legend}>
        {keys.map((key) => (
          <div key={key} className={styles.row}>
            <span className={styles.swatch} style={{ ["--swatch" as string]: COLORS[key] }} />
            <span className={styles.name}>{MACRO_LABELS[key]}</span>
            <span className={styles.sub}>{formatGrams(totals[key])}/day</span>
            <span className={styles.value}>{hasData ? formatPercent(distribution[key]) : "--"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
