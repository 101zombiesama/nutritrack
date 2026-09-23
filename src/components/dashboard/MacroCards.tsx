"use client";

import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { formatGrams, formatNumber, progressCopy } from "@/lib/format";
import { MACRO_LABELS, type GoalProgress } from "@/lib/nutrition";
import type { MacroKey } from "@/lib/types";
import styles from "./MacroCards.module.css";

export const MACRO_COLORS: Record<MacroKey, string> = {
  protein: "var(--protein)",
  carbs: "var(--carbs)",
  fat: "var(--fat)",
};

interface MacroCardsProps {
  progress: Record<MacroKey, GoalProgress>;
}

function statusClass(state: GoalProgress["state"]) {
  if (state === "over") return styles.statusOver;
  if (state === "near") return styles.statusNear;
  if (state === "met") return styles.statusMet;
  return "";
}

export function MacroCards({ progress }: MacroCardsProps) {
  return (
    <div className={styles.grid}>
      {(Object.keys(MACRO_LABELS) as MacroKey[]).map((key) => {
        const item = progress[key];
        const color = MACRO_COLORS[key];
        const isOver = item.over > 0;

        return (
          <Card key={key} className={styles.card}>
            <div className={styles.head}>
              <span className={styles.name}>
                <span
                  className={styles.swatch}
                  style={{ ["--macro-color" as string]: color }}
                  aria-hidden="true"
                />
                {MACRO_LABELS[key]}
              </span>
              <span className={`${styles.percent} ${isOver ? styles.percentOver : ""} tabular`}>
                {formatNumber(item.percent)}%
              </span>
            </div>

            <div className={styles.values}>
              <span className={`${styles.current} tabular`}>{formatGrams(item.consumed)}</span>
              <span className={`${styles.goal} tabular`}>/ {formatGrams(item.goal)}</span>
            </div>

            <ProgressBar
              percent={item.percent}
              color={color}
              label={`${MACRO_LABELS[key]}: ${formatGrams(item.consumed)} of ${formatGrams(item.goal)}`}
            />

            <p className={`${styles.status} ${statusClass(item.state)}`}>
              {progressCopy(item, "g")}
              {item.mode === "limit" ? <span className={styles.goal}> · daily max</span> : null}
            </p>
          </Card>
        );
      })}
    </div>
  );
}
