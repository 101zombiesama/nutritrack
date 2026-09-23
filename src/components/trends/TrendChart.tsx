"use client";

import { useState } from "react";
import { formatShortDate, formatWeekday } from "@/lib/dates";
import { formatNumber } from "@/lib/format";
import styles from "./TrendChart.module.css";

export interface TrendPoint {
  date: string;
  value: number;
  hasData: boolean;
}

interface TrendChartProps {
  points: TrendPoint[];
  color: string;
  unit: string;
  seriesLabel: string;
  target?: number;
  targetLabel?: string;
}

const VIEW_W = 720;
const VIEW_H = 250;
const PAD = { top: 18, right: 14, bottom: 26, left: 46 };

function niceCeiling(value: number) {
  if (value <= 0) return 10;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  return Math.ceil(value / (magnitude / 2)) * (magnitude / 2);
}

export function TrendChart({
  points,
  color,
  unit,
  seriesLabel,
  target,
  targetLabel,
}: TrendChartProps) {
  const [hover, setHover] = useState<number | null>(null);

  const plotW = VIEW_W - PAD.left - PAD.right;
  const plotH = VIEW_H - PAD.top - PAD.bottom;

  const maxValue = Math.max(
    ...points.map((point) => point.value),
    target ? target * 1.1 : 0,
    1,
  );
  const yMax = niceCeiling(maxValue);
  const slot = plotW / Math.max(points.length, 1);
  const gap = points.length > 45 ? 1.5 : points.length > 14 ? 3 : 8;
  const barWidth = Math.min(Math.max(2, slot - gap), 34);
  const radius = Math.min(4, barWidth / 2);

  const yFor = (value: number) => PAD.top + plotH - (value / yMax) * plotH;
  const ticks = [0, yMax / 2, yMax];

  const labelEvery = Math.max(1, Math.ceil(points.length / 7));
  const hovered = hover !== null ? points[hover] : null;
  const hoveredX = hover !== null ? PAD.left + slot * hover + slot / 2 : 0;
  const hoveredY = hovered ? yFor(hovered.value) : 0;

  const summary = `${seriesLabel} across ${points.length} days${
    target ? `, target ${formatNumber(target)} ${unit}` : ""
  }`;

  return (
    <div className={styles.wrap}>
      <svg
        className={styles.svg}
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        role="img"
        aria-label={summary}
        onMouseLeave={() => setHover(null)}
      >
        {ticks.map((tick) => (
          <g key={tick}>
            <line
              className={styles.grid}
              x1={PAD.left}
              x2={VIEW_W - PAD.right}
              y1={yFor(tick)}
              y2={yFor(tick)}
            />
            <text className={styles.axisLabel} x={PAD.left - 10} y={yFor(tick) + 4} textAnchor="end">
              {formatNumber(tick)}
            </text>
          </g>
        ))}

        {points.map((point, index) => {
          if (!point.hasData || point.value <= 0) return null;
          const height = Math.max(2, plotH - (yFor(point.value) - PAD.top));
          const x = PAD.left + slot * index + (slot - barWidth) / 2;
          return (
            <rect
              key={point.date}
              className={`${styles.bar} ${hover !== null && hover !== index ? styles.barMuted : ""}`}
              x={x}
              y={yFor(point.value)}
              width={barWidth}
              height={height}
              rx={radius}
              fill={color}
            />
          );
        })}

        {target ? (
          <>
            <line
              className={styles.targetLine}
              x1={PAD.left}
              x2={VIEW_W - PAD.right}
              y1={yFor(target)}
              y2={yFor(target)}
            />
            <text
              className={styles.targetLabel}
              x={VIEW_W - PAD.right}
              y={yFor(target) - 6}
              textAnchor="end"
            >
              {targetLabel ?? `Target ${formatNumber(target)}`}
            </text>
          </>
        ) : null}

        {points.map((point, index) => {
          const showLabel = index % labelEvery === 0;
          if (!showLabel) return null;
          return (
            <text
              key={`label-${point.date}`}
              className={styles.axisLabel}
              x={PAD.left + slot * index + slot / 2}
              y={VIEW_H - 8}
              textAnchor="middle"
            >
              {points.length <= 7 ? formatWeekday(point.date) : formatShortDate(point.date)}
            </text>
          );
        })}

        {points.map((point, index) => (
          <rect
            key={`hit-${point.date}`}
            className={styles.hit}
            x={PAD.left + slot * index}
            y={PAD.top}
            width={slot}
            height={plotH}
            onMouseEnter={() => setHover(index)}
          />
        ))}
      </svg>

      {hovered ? (
        <div
          className={styles.tooltip}
          style={{
            left: `${(hoveredX / VIEW_W) * 100}%`,
            top: `${((hovered.hasData ? hoveredY : PAD.top + plotH) / VIEW_H) * 100}%`,
            marginTop: -8,
          }}
        >
          <span className={styles.tooltipDate}>{formatShortDate(hovered.date)}</span>
          <span className={styles.tooltipValue}>
            {hovered.hasData ? `${formatNumber(hovered.value)} ${unit}` : "Not tracked"}
          </span>
        </div>
      ) : null}

      <div className={styles.legend}>
        <span className={styles.legendItem}>
          <span className={styles.legendSwatch} style={{ ["--swatch" as string]: color }} />
          {seriesLabel}
        </span>
        {target ? (
          <span className={styles.legendItem}>
            <span className={styles.legendDash} />
            {targetLabel ?? `Target ${formatNumber(target)} ${unit}`}
          </span>
        ) : null}
      </div>

      <table className="sr-only">
        <caption>{summary}</caption>
        <thead>
          <tr>
            <th scope="col">Date</th>
            <th scope="col">{seriesLabel}</th>
          </tr>
        </thead>
        <tbody>
          {points.map((point) => (
            <tr key={`row-${point.date}`}>
              <th scope="row">{formatShortDate(point.date)}</th>
              <td>{point.hasData ? `${formatNumber(point.value)} ${unit}` : "Not tracked"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
