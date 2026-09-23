"use client";

import { useMemo, useState } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { ChartIcon, ScaleIcon } from "@/components/ui/Icons";
import { MacroDonut } from "@/components/trends/MacroDonut";
import { StatGrid, StatTile } from "@/components/trends/StatTile";
import { TrendChart, type TrendPoint } from "@/components/trends/TrendChart";
import { WeightChart } from "@/components/trends/WeightChart";
import { lastNDays } from "@/lib/dates";
import { displayWeight, formatDecimal, formatGrams, formatNumber, weightUnitLabel } from "@/lib/format";
import {
  averageTotals,
  dailySummaries,
  daysWithinCalorieTarget,
  MACRO_LABELS,
} from "@/lib/nutrition";
import type { GoalKey } from "@/lib/types";
import { useApp } from "@/state/AppProvider";
import styles from "./page.module.css";

type Period = "7" | "30" | "90";

const METRIC_OPTIONS = [
  { value: "calories" as const, label: "Calories", color: "var(--brand)" },
  { value: "protein" as const, label: "Protein", color: "var(--protein)" },
  { value: "carbs" as const, label: "Carbs", color: "var(--carbs)" },
  { value: "fat" as const, label: "Fat", color: "var(--fat)" },
];

const PERIOD_OPTIONS = [
  { value: "7" as const, label: "7 days" },
  { value: "30" as const, label: "30 days" },
  { value: "90" as const, label: "90 days" },
];

const METRIC_UNITS: Record<GoalKey, string> = {
  calories: "kcal",
  protein: "g",
  carbs: "g",
  fat: "g",
};

export default function TrendsPage() {
  const { data } = useApp();
  const [period, setPeriod] = useState<Period>("7");
  const [metric, setMetric] = useState<GoalKey>("calories");

  const days = Number(period);
  const summaries = useMemo(() => dailySummaries(data.meals, lastNDays(days)), [data.meals, days]);
  const trackedDays = summaries.filter((day) => day.hasData).length;
  const averages = useMemo(() => averageTotals(summaries), [summaries]);
  const within = useMemo(
    () => daysWithinCalorieTarget(summaries, data.goals.calories),
    [summaries, data.goals.calories],
  );

  const points: TrendPoint[] = summaries.map((day) => ({
    date: day.date,
    value: day.totals[metric],
    hasData: day.hasData,
  }));

  const metricColor = METRIC_OPTIONS.find((option) => option.value === metric)?.color ?? "var(--brand)";
  const metricLabel = metric === "calories" ? "Calories" : MACRO_LABELS[metric];
  const goalValue = data.goals[metric];
  const goalMode = data.goals.modes[metric];

  const units = data.profile.units;
  const unitLabel = weightUnitLabel(units);
  const sortedWeights = useMemo(
    () => [...data.weights].sort((a, b) => a.date.localeCompare(b.date)),
    [data.weights],
  );
  // A short period can hold only a weigh-in or two, which reads as a flat line;
  // fall back to the most recent entries and say so.
  const weightInPeriod = useMemo(() => {
    const cutoff = lastNDays(days)[0];
    return sortedWeights.filter((entry) => entry.date >= cutoff);
  }, [sortedWeights, days]);
  const usingRecentWeights = weightInPeriod.length < 3 && sortedWeights.length >= 3;
  const weightEntries = usingRecentWeights ? sortedWeights.slice(-8) : weightInPeriod;

  const latestWeight = sortedWeights.length > 0 ? sortedWeights[sortedWeights.length - 1] : null;
  const firstInPeriod = weightEntries[0];
  const weightDelta =
    latestWeight && firstInPeriod ? latestWeight.weightKg - firstInPeriod.weightKg : 0;

  if (trackedDays === 0) {
    return (
      <div className={styles.page}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>Trends</h1>
            <p className={styles.subtitle}>Your nutrition over time.</p>
          </div>
        </header>
        <Card padding="large">
          <EmptyState
            icon={<ChartIcon size={20} />}
            title="No trend data yet"
            description="Keep logging meals to unlock your nutrition trends."
          />
        </Card>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Trends</h1>
          <p className={styles.subtitle}>
            {trackedDays} of the last {days} days tracked.
          </p>
        </div>
        <SegmentedControl
          options={PERIOD_OPTIONS}
          value={period}
          onChange={setPeriod}
          ariaLabel="Select time period"
        />
      </header>

      <Card padding="large">
        <div className={styles.chartHead}>
          <div>
            <h2 className={styles.chartTitle}>Daily {metricLabel.toLowerCase()}</h2>
            <p className={styles.chartNote}>
              {goalMode === "limit" ? "Dashed line is your daily maximum" : "Dashed line is your daily target"}
            </p>
          </div>
          <SegmentedControl
            options={METRIC_OPTIONS}
            value={metric}
            onChange={setMetric}
            ariaLabel="Select nutrient"
          />
        </div>

        <TrendChart
          points={points}
          color={metricColor}
          unit={METRIC_UNITS[metric]}
          seriesLabel={metricLabel}
          target={goalValue}
          targetLabel={`${goalMode === "limit" ? "Max" : "Target"} ${formatNumber(goalValue)}`}
        />
      </Card>

      <Card padding="large">
        <CardHeader
          title={`Averages over ${days} days`}
          subtitle={`Based on ${trackedDays} tracked ${trackedDays === 1 ? "day" : "days"}`}
        />
        <StatGrid>
          <StatTile
            label="Avg calories"
            value={formatNumber(averages.calories)}
            unit="kcal"
            sub={`Goal ${formatNumber(data.goals.calories)} kcal`}
            color="var(--brand)"
          />
          <StatTile
            label="Avg protein"
            value={formatNumber(averages.protein)}
            unit="g"
            sub={`Goal ${formatGrams(data.goals.protein)}`}
            color="var(--protein)"
          />
          <StatTile
            label="Avg carbs"
            value={formatNumber(averages.carbs)}
            unit="g"
            sub={`Goal ${formatGrams(data.goals.carbs)}`}
            color="var(--carbs)"
          />
          <StatTile
            label="Avg fat"
            value={formatNumber(averages.fat)}
            unit="g"
            sub={`Goal ${formatGrams(data.goals.fat)}`}
            color="var(--fat)"
          />
          <StatTile
            label="Within calorie target"
            value={`${within.within}/${within.tracked}`}
            sub="Days inside ±10% of goal"
          />
        </StatGrid>
      </Card>

      <Card padding="large">
        <CardHeader
          title="Macro distribution"
          subtitle="Share of daily calories, averaged over the period"
        />
        <MacroDonut totals={averages} />
      </Card>

      <Card padding="large">
        <div className={styles.weightHead}>
          <div>
            <h2 className={styles.chartTitle}>Body weight</h2>
            <p className={styles.chartNote}>
              {weightEntries.length > 1
                ? `${weightDelta <= 0 ? "Down" : "Up"} ${formatDecimal(
                    Math.abs(displayWeight(weightDelta, units)),
                  )} ${unitLabel} ${
                    usingRecentWeights
                      ? `across your last ${weightEntries.length} weigh-ins`
                      : "over this period"
                  }`
                : "Log your weight to see progress"}
            </p>
          </div>
          {latestWeight ? (
            <div className={styles.weightProgress}>
              <span className={`${styles.weightValue} tabular`}>
                {formatDecimal(displayWeight(latestWeight.weightKg, units))} {unitLabel}
              </span>
              <span className={styles.arrow} aria-hidden="true">
                →
              </span>
              <span className={`${styles.weightValue} tabular`} style={{ color: "var(--brand)" }}>
                {formatDecimal(displayWeight(data.profile.goalWeightKg, units))} {unitLabel}
              </span>
            </div>
          ) : null}
        </div>

        {weightEntries.length > 1 ? (
          <WeightChart
            entries={weightEntries}
            goalWeight={data.profile.goalWeightKg}
            unitLabel={unitLabel}
            convert={(kg) => displayWeight(kg, units)}
          />
        ) : (
          <EmptyState
            compact
            icon={<ScaleIcon size={20} />}
            title="Not enough weight entries"
            description="Add a couple of weigh-ins from Profile to see your trend here."
          />
        )}
      </Card>
    </div>
  );
}
