"use client";

import { useState } from "react";
import { formatShortDate } from "@/lib/dates";
import { formatDecimal } from "@/lib/format";
import type { WeightEntry } from "@/lib/types";
import styles from "./TrendChart.module.css";

interface WeightChartProps {
  entries: WeightEntry[];
  goalWeight: number;
  unitLabel: string;
  /** Converts stored kilograms into the user's display unit. */
  convert: (kg: number) => number;
}

const VIEW_W = 720;
const VIEW_H = 230;
const PAD = { top: 18, right: 16, bottom: 26, left: 48 };

export function WeightChart({ entries, goalWeight, unitLabel, convert }: WeightChartProps) {
  const [hover, setHover] = useState<number | null>(null);

  const plotW = VIEW_W - PAD.left - PAD.right;
  const plotH = VIEW_H - PAD.top - PAD.bottom;

  const values = entries.map((entry) => convert(entry.weightKg));
  const goal = convert(goalWeight);
  const min = Math.min(...values, goal);
  const max = Math.max(...values, goal);
  const padding = Math.max((max - min) * 0.25, 1);
  const yMin = min - padding;
  const yMax = max + padding;

  const xFor = (index: number) =>
    entries.length <= 1 ? PAD.left + plotW / 2 : PAD.left + (plotW * index) / (entries.length - 1);
  const yFor = (value: number) => PAD.top + plotH - ((value - yMin) / (yMax - yMin)) * plotH;

  const path = values.map((value, index) => `${index === 0 ? "M" : "L"}${xFor(index)},${yFor(value)}`).join(" ");
  const area = `${path} L${xFor(values.length - 1)},${PAD.top + plotH} L${xFor(0)},${PAD.top + plotH} Z`;

  const ticks = [yMin + (yMax - yMin) * 0.15, (yMin + yMax) / 2, yMax - (yMax - yMin) * 0.15];
  const labelEvery = Math.max(1, Math.ceil(entries.length / 6));
  const hovered = hover !== null ? entries[hover] : null;

  return (
    <div className={styles.wrap}>
      <svg
        className={styles.svg}
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        role="img"
        aria-label={`Body weight over ${entries.length} entries, goal ${formatDecimal(goal)} ${unitLabel}`}
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id="weight-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--brand)" stopOpacity="0.18" />
            <stop offset="100%" stopColor="var(--brand)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {ticks.map((tick) => (
          <g key={tick}>
            <line className={styles.grid} x1={PAD.left} x2={VIEW_W - PAD.right} y1={yFor(tick)} y2={yFor(tick)} />
            <text className={styles.axisLabel} x={PAD.left - 10} y={yFor(tick) + 4} textAnchor="end">
              {formatDecimal(tick)}
            </text>
          </g>
        ))}

        <line
          className={styles.targetLine}
          x1={PAD.left}
          x2={VIEW_W - PAD.right}
          y1={yFor(goal)}
          y2={yFor(goal)}
        />
        <text className={styles.targetLabel} x={VIEW_W - PAD.right} y={yFor(goal) - 6} textAnchor="end">
          Goal {formatDecimal(goal)} {unitLabel}
        </text>

        <path d={area} fill="url(#weight-fill)" />
        <path className={styles.line} d={path} stroke="var(--brand)" />

        {values.map((value, index) => {
          const isEdge = index === 0 || index === values.length - 1;
          if (!isEdge && hover !== index && entries.length > 14) return null;
          return (
            <circle
              key={entries[index].id}
              className={styles.marker}
              cx={xFor(index)}
              cy={yFor(value)}
              r={hover === index ? 6 : 4.5}
              fill="var(--brand)"
            />
          );
        })}

        {entries.map((entry, index) =>
          index % labelEvery === 0 ? (
            <text
              key={`label-${entry.id}`}
              className={styles.axisLabel}
              x={xFor(index)}
              y={VIEW_H - 8}
              textAnchor="middle"
            >
              {formatShortDate(entry.date)}
            </text>
          ) : null,
        )}

        {entries.map((entry, index) => (
          <rect
            key={`hit-${entry.id}`}
            className={styles.hit}
            x={xFor(index) - plotW / Math.max(entries.length, 1) / 2}
            y={PAD.top}
            width={plotW / Math.max(entries.length, 1)}
            height={plotH}
            onMouseEnter={() => setHover(index)}
          />
        ))}
      </svg>

      {hovered ? (
        <div
          className={styles.tooltip}
          style={{
            left: `${(xFor(hover!) / VIEW_W) * 100}%`,
            top: `${(yFor(convert(hovered.weightKg)) / VIEW_H) * 100}%`,
            marginTop: -10,
          }}
        >
          <span className={styles.tooltipDate}>{formatShortDate(hovered.date)}</span>
          <span className={styles.tooltipValue}>
            {formatDecimal(convert(hovered.weightKg))} {unitLabel}
          </span>
        </div>
      ) : null}

      <div className={styles.legend}>
        <span className={styles.legendItem}>
          <span className={styles.legendSwatch} style={{ ["--swatch" as string]: "var(--brand)" }} />
          Body weight
        </span>
        <span className={styles.legendItem}>
          <span className={styles.legendDash} />
          Goal weight
        </span>
      </div>
    </div>
  );
}
