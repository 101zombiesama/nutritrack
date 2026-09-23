"use client";

import { useState } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/Field";
import { EmptyState } from "@/components/ui/EmptyState";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ScaleIcon, TrashIcon } from "@/components/ui/Icons";
import { relativeDayLabel } from "@/lib/dates";
import { displayWeight, formatDecimal, lbToKg, parseNumber, weightUnitLabel } from "@/lib/format";
import type { UserProfile, WeightEntry } from "@/lib/types";
import styles from "./forms.module.css";

interface WeightPanelProps {
  profile: UserProfile;
  entries: WeightEntry[];
  onLog: (weightKg: number) => void;
  onDelete: (id: string) => void;
}

export function WeightPanel({ profile, entries, onLog, onDelete }: WeightPanelProps) {
  const units = profile.units;
  const unitLabel = weightUnitLabel(units);
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));
  const latest = sorted[0];
  const start = entries.length > 0 ? entries[0].weightKg : profile.weightKg;
  const current = latest ? latest.weightKg : profile.weightKg;
  const goal = profile.goalWeightKg;

  const totalChange = start - goal;
  const achieved = start - current;
  const percent = totalChange === 0 ? 100 : Math.max(0, Math.min(100, (achieved / totalChange) * 100));
  const remaining = Math.abs(current - goal);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const parsed = parseNumber(value);
    if (parsed === null || parsed <= 0) {
      setError("Enter today's weight.");
      return;
    }
    const kg = units === "metric" ? parsed : lbToKg(parsed);
    if (kg < 30 || kg > 300) {
      setError("That looks out of range - check the number.");
      return;
    }
    onLog(Math.round(kg * 10) / 10);
    setValue("");
    setError(null);
  };

  return (
    <Card padding="large" as="section">
      <CardHeader title="Weight" subtitle="Weigh-ins power the weight trend on the Trends screen." />

      <div className={styles.progressLine}>
        <span className={`${styles.big} tabular`}>
          {formatDecimal(displayWeight(current, units))} {unitLabel}
        </span>
        <span className={styles.arrow} aria-hidden="true">
          →
        </span>
        <span className={`${styles.big} tabular`} style={{ color: "var(--brand)" }}>
          {formatDecimal(displayWeight(goal, units))} {unitLabel}
        </span>
      </div>

      <ProgressBar
        percent={percent}
        thick
        label={`Weight progress: ${Math.round(percent)}% of the way to your goal`}
      />
      <p className={styles.progressMeta}>
        {remaining < 0.15
          ? "You're at your goal weight."
          : `${formatDecimal(displayWeight(remaining, units))} ${unitLabel} ${
              current > goal ? "to go" : "below goal"
            } · ${Math.round(percent)}% of the way there`}
      </p>

      <form onSubmit={submit} className={styles.weightRow} style={{ marginTop: 18 }}>
        <TextField
          label="Log today's weight"
          value={value}
          inputMode="decimal"
          suffix={unitLabel}
          placeholder={formatDecimal(displayWeight(current, units))}
          onChange={(event) => setValue(event.target.value)}
          error={error ?? undefined}
        />
        <Button type="submit" variant="primary">
          Add weigh-in
        </Button>
      </form>

      {sorted.length === 0 ? (
        <div style={{ marginTop: 16 }}>
          <EmptyState
            compact
            icon={<ScaleIcon size={20} />}
            title="No weigh-ins yet"
            description="Add your first entry to start tracking progress."
          />
        </div>
      ) : (
        <ul className={styles.entries}>
          {sorted.slice(0, 6).map((entry) => (
            <li key={entry.id} className={styles.entry}>
              <span className={styles.entryDate}>{relativeDayLabel(entry.date)}</span>
              <span className={styles.entryValue}>
                {formatDecimal(displayWeight(entry.weightKg, units))} {unitLabel}
              </span>
              <button
                type="button"
                className={styles.entryDelete}
                onClick={() => onDelete(entry.id)}
                aria-label={`Delete weigh-in from ${relativeDayLabel(entry.date)}`}
              >
                <TrashIcon size={15} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
