"use client";

import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatNumber } from "@/lib/format";
import type { GoalProgress } from "@/lib/nutrition";
import styles from "./CalorieSummary.module.css";

const SIZE = 188;
const STROKE = 16;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface CalorieSummaryProps {
  progress: GoalProgress;
  mealCount: number;
}

export function CalorieSummary({ progress, mealCount }: CalorieSummaryProps) {
  const isOver = progress.over > 0;
  const filled = Math.min(100, progress.percent);
  const overflow = isOver ? Math.min(100, progress.percent - 100) : 0;

  const summaryLabel = isOver
    ? `${formatNumber(progress.consumed)} of ${formatNumber(progress.goal)} kcal, ${formatNumber(progress.over)} over`
    : `${formatNumber(progress.consumed)} of ${formatNumber(progress.goal)} kcal, ${formatNumber(progress.remaining)} remaining`;

  return (
    <Card padding="large">
      <div className={styles.card}>
        <div className={styles.ringWrap}>
          <svg
            className={styles.ring}
            viewBox={`0 0 ${SIZE} ${SIZE}`}
            role="img"
            aria-label={`Calories today: ${summaryLabel}`}
          >
            <circle
              className={styles.track}
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              fill="none"
              strokeWidth={STROKE}
            />
            <circle
              className={styles.progress}
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              fill="none"
              strokeWidth={STROKE}
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={CIRCUMFERENCE * (1 - filled / 100)}
            />
            {overflow > 0 ? (
              <circle
                className={`${styles.progress} ${styles.over}`}
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={RADIUS - STROKE - 3}
                fill="none"
                strokeWidth={5}
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * (RADIUS - STROKE - 3)}
                strokeDashoffset={2 * Math.PI * (RADIUS - STROKE - 3) * (1 - overflow / 100)}
              />
            ) : null}
          </svg>
          <div className={styles.center}>
            <span className={`${styles.bigNumber} tabular`}>{formatNumber(progress.consumed)}</span>
            <span className={styles.bigLabel}>of {formatNumber(progress.goal)} kcal</span>
            <span className={styles.statusPill}>
              {isOver ? (
                <Badge tone="over">{formatNumber(progress.over)} over</Badge>
              ) : progress.state === "near" ? (
                <Badge tone="warning">Close to goal</Badge>
              ) : (
                <Badge tone="brand">{Math.round(progress.percent)}% of goal</Badge>
              )}
            </span>
          </div>
        </div>

        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Consumed</span>
            <span className={`${styles.statValue} tabular`}>
              {formatNumber(progress.consumed)}
              <span className={styles.statUnit}>kcal</span>
            </span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Goal</span>
            <span className={`${styles.statValue} tabular`}>
              {formatNumber(progress.goal)}
              <span className={styles.statUnit}>kcal</span>
            </span>
          </div>
          <div className={`${styles.stat} ${isOver ? styles.remainingOver : ""}`}>
            <span className={styles.statLabel}>{isOver ? "Over" : "Remaining"}</span>
            <span className={`${styles.statValue} tabular`}>
              {formatNumber(isOver ? progress.over : progress.remaining)}
              <span className={styles.statUnit}>kcal</span>
            </span>
          </div>
        </div>
      </div>

      <div className={styles.footer}>
        <p className={styles.meta}>
          {mealCount === 0
            ? "Nothing logged yet today."
            : `From ${mealCount} ${mealCount === 1 ? "meal" : "meals"} logged today.`}
        </p>
        <p className={styles.meta}>
          {isOver
            ? "Tomorrow is a fresh start."
            : `${Math.round(100 - Math.min(100, progress.percent))}% of today's energy still available.`}
        </p>
      </div>
    </Card>
  );
}
