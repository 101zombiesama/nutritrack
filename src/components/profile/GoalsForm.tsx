"use client";

import { useMemo, useState } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { SelectField, TextField } from "@/components/ui/Field";
import { CheckIcon, InfoIcon, SparkIcon } from "@/components/ui/Icons";
import { formatNumber, parseNumber } from "@/lib/format";
import { KCAL_PER_GRAM, suggestGoals } from "@/lib/nutrition";
import type { GoalKey, GoalMode, NutritionGoals, UserProfile } from "@/lib/types";
import styles from "./forms.module.css";

const ROWS: Array<{
  key: GoalKey;
  label: string;
  unit: string;
  color?: string;
  hint: string;
}> = [
  { key: "calories", label: "Daily calories", unit: "kcal", color: "var(--brand)", hint: "Total energy for the day" },
  { key: "protein", label: "Protein", unit: "g", color: "var(--protein)", hint: "Usually something to reach" },
  { key: "carbs", label: "Carbohydrates", unit: "g", color: "var(--carbs)", hint: "Often tracked as a ceiling" },
  { key: "fat", label: "Fat", unit: "g", color: "var(--fat)", hint: "Often tracked as a ceiling" },
];

interface GoalsFormProps {
  goals: NutritionGoals;
  profile: UserProfile;
  onSave: (goals: NutritionGoals) => void;
}

export function GoalsForm({ goals, profile, onSave }: GoalsFormProps) {
  const [values, setValues] = useState<Record<GoalKey, string>>({
    calories: String(goals.calories),
    protein: String(goals.protein),
    carbs: String(goals.carbs),
    fat: String(goals.fat),
  });
  const [modes, setModes] = useState<Record<GoalKey, GoalMode>>(goals.modes);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // Goals can change from elsewhere (e.g. "use suggested"); re-sync the form
  // during render rather than in an effect. See react.dev "adjusting state".
  const [syncedGoals, setSyncedGoals] = useState(goals);
  if (syncedGoals !== goals) {
    setSyncedGoals(goals);
    setValues({
      calories: String(goals.calories),
      protein: String(goals.protein),
      carbs: String(goals.carbs),
      fat: String(goals.fat),
    });
    setModes(goals.modes);
  }

  const suggested = useMemo(() => suggestGoals(profile), [profile]);

  const macroCalories =
    (parseNumber(values.protein) ?? 0) * KCAL_PER_GRAM.protein +
    (parseNumber(values.carbs) ?? 0) * KCAL_PER_GRAM.carbs +
    (parseNumber(values.fat) ?? 0) * KCAL_PER_GRAM.fat;
  const calorieGoal = parseNumber(values.calories) ?? 0;
  const difference = macroCalories - calorieGoal;

  const handleSave = (event: React.FormEvent) => {
    event.preventDefault();
    const parsed = {
      calories: parseNumber(values.calories),
      protein: parseNumber(values.protein),
      carbs: parseNumber(values.carbs),
      fat: parseNumber(values.fat),
    };
    if (Object.values(parsed).some((value) => value === null || value <= 0)) {
      setError("Every goal needs to be a number above zero.");
      return;
    }
    setError(null);
    onSave({
      calories: Math.round(parsed.calories!),
      protein: Math.round(parsed.protein!),
      carbs: Math.round(parsed.carbs!),
      fat: Math.round(parsed.fat!),
      modes,
    });
    setSaved(true);
  };

  const applySuggested = () => {
    setValues({
      calories: String(suggested.calories),
      protein: String(suggested.protein),
      carbs: String(suggested.carbs),
      fat: String(suggested.fat),
    });
    setModes(suggested.modes);
    setSaved(false);
  };

  return (
    <Card padding="large" as="section">
      <CardHeader
        title="Nutrition goals"
        subtitle="These drive every progress bar and the target lines in Trends."
      />

      <form onSubmit={handleSave}>
        {ROWS.map((row) => (
          <div key={row.key} className={styles.goalRow}>
            <div className={styles.goalLabel}>
              <span className={styles.goalName}>
                <span className={styles.goalDot} style={{ ["--dot" as string]: row.color }} />
                {row.label}
              </span>
              <span className={styles.goalHint}>{row.hint}</span>
            </div>
            <TextField
              label="Amount"
              value={values[row.key]}
              inputMode="numeric"
              suffix={row.unit}
              onChange={(event) => {
                setValues((current) => ({ ...current, [row.key]: event.target.value }));
                setSaved(false);
              }}
            />
            <SelectField
              label="Treated as"
              value={modes[row.key]}
              onChange={(event) => {
                setModes((current) => ({ ...current, [row.key]: event.target.value as GoalMode }));
                setSaved(false);
              }}
            >
              <option value="target">Target</option>
              <option value="limit">Daily max</option>
            </SelectField>
          </div>
        ))}

        <div className={styles.energyNote}>
          <InfoIcon size={16} />
          <span>
            Your macro goals add up to <strong>{formatNumber(macroCalories)} kcal</strong>
            {Math.abs(difference) < 60
              ? " - a good match for your calorie goal."
              : difference > 0
                ? `, which is ${formatNumber(difference)} kcal above your calorie goal. That's fine, but the bars can fill at different speeds.`
                : `, which is ${formatNumber(-difference)} kcal below your calorie goal.`}
          </span>
        </div>

        <div className={styles.actions}>
          <Button type="submit" variant="primary">
            Save goals
          </Button>
          {saved ? (
            <span className={styles.savedNote}>
              <CheckIcon size={15} /> Goals updated everywhere
            </span>
          ) : null}
          {error ? <span style={{ color: "var(--over)", fontSize: "0.82rem" }}>{error}</span> : null}
        </div>
      </form>

      <div className={styles.suggested}>
        <div className={styles.suggestedHead}>
          <span className={styles.suggestedTitle}>
            <SparkIcon size={16} />
            Suggested goals
            <Badge tone="outline">Not your targets yet</Badge>
          </span>
          <Button size="sm" variant="secondary" onClick={applySuggested}>
            Use these numbers
          </Button>
        </div>
        <div className={styles.suggestedValues}>
          <span className={styles.suggestedValue}>
            <span className={styles.suggestedNumber}>{formatNumber(suggested.calories)} kcal</span>
            Calories
          </span>
          <span className={styles.suggestedValue}>
            <span className={styles.suggestedNumber}>{suggested.protein} g</span>
            Protein
          </span>
          <span className={styles.suggestedValue}>
            <span className={styles.suggestedNumber}>{suggested.carbs} g</span>
            Carbs
          </span>
          <span className={styles.suggestedValue}>
            <span className={styles.suggestedNumber}>{suggested.fat} g</span>
            Fat
          </span>
        </div>
        <p className={styles.disclaimer}>
          {suggested.rationale} These are rough estimates from a standard formula, not medical or
          dietary advice - check with a professional before making big changes.
        </p>
      </div>
    </Card>
  );
}
