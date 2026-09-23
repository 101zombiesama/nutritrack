"use client";

import { useState } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { SelectField, TextField } from "@/components/ui/Field";
import { CheckIcon } from "@/components/ui/Icons";
import {
  cmToFeetInches,
  feetInchesToCm,
  formatDecimal,
  kgToLb,
  lbToKg,
  parseNumber,
  weightUnitLabel,
} from "@/lib/format";
import { ACTIVITY_LABELS } from "@/lib/nutrition";
import type { ActivityLevel, Sex, Units, UserProfile } from "@/lib/types";
import styles from "./forms.module.css";

interface ProfileFormProps {
  profile: UserProfile;
  onSave: (profile: UserProfile) => void;
}

interface FormState {
  name: string;
  age: string;
  sex: Sex;
  units: Units;
  heightCm: string;
  feet: string;
  inches: string;
  weight: string;
  goalWeight: string;
}

function toFormState(profile: UserProfile): FormState {
  const { feet, inches } = cmToFeetInches(profile.heightCm);
  const toDisplay = (kg: number) =>
    profile.units === "metric" ? formatDecimal(kg, 1) : formatDecimal(kgToLb(kg), 1);
  return {
    name: profile.name,
    age: String(profile.age),
    sex: profile.sex,
    units: profile.units,
    heightCm: String(Math.round(profile.heightCm)),
    feet: String(feet),
    inches: String(inches),
    weight: toDisplay(profile.weightKg),
    goalWeight: toDisplay(profile.goalWeightKg),
  };
}

export function ProfileForm({ profile, onSave }: ProfileFormProps) {
  const [form, setForm] = useState<FormState>(() => toFormState(profile));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  // Re-sync when the stored profile changes (saved here or elsewhere).
  const [syncedProfile, setSyncedProfile] = useState(profile);
  if (syncedProfile !== profile) {
    setSyncedProfile(profile);
    setForm(toFormState(profile));
  }

  const patch = (next: Partial<FormState>) => {
    setForm((current) => ({ ...current, ...next }));
    setSaved(false);
  };

  const changeUnits = (units: Units) => {
    const weight = parseNumber(form.weight);
    const goal = parseNumber(form.goalWeight);
    const convert = (value: number | null) => {
      if (value === null) return "";
      return units === "imperial" ? formatDecimal(kgToLb(value), 1) : formatDecimal(lbToKg(value), 1);
    };
    patch({ units, weight: convert(weight), goalWeight: convert(goal) });
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};

    const age = parseNumber(form.age);
    if (age === null || age < 13 || age > 110) nextErrors.age = "Enter an age between 13 and 110.";

    const heightCm =
      form.units === "metric"
        ? parseNumber(form.heightCm)
        : feetInchesToCm(parseNumber(form.feet) ?? 0, parseNumber(form.inches) ?? 0);
    if (!heightCm || heightCm < 120 || heightCm > 230) nextErrors.height = "Enter a realistic height.";

    const weightInput = parseNumber(form.weight);
    const goalInput = parseNumber(form.goalWeight);
    const weightKg = weightInput === null ? null : form.units === "metric" ? weightInput : lbToKg(weightInput);
    const goalKg = goalInput === null ? null : form.units === "metric" ? goalInput : lbToKg(goalInput);
    if (!weightKg || weightKg < 30 || weightKg > 300) nextErrors.weight = "Enter a realistic weight.";
    if (!goalKg || goalKg < 30 || goalKg > 300) nextErrors.goalWeight = "Enter a realistic goal weight.";
    if (!form.name.trim()) nextErrors.name = "What should we call you?";

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    onSave({
      name: form.name.trim(),
      age: Math.round(age!),
      sex: form.sex,
      heightCm: Math.round(heightCm!),
      weightKg: Math.round(weightKg! * 10) / 10,
      goalWeightKg: Math.round(goalKg! * 10) / 10,
      activityLevel: profile.activityLevel,
      units: form.units,
    });
    setSaved(true);
  };

  const unitLabel = weightUnitLabel(form.units);

  return (
    <Card padding="large" as="section">
      <CardHeader
        title="Personal information"
        subtitle="Used for suggested goals and unit display only."
      />
      <form onSubmit={handleSubmit}>
        <div className={styles.grid}>
          <TextField
            label="Name"
            value={form.name}
            onChange={(event) => patch({ name: event.target.value })}
            error={errors.name}
            autoComplete="given-name"
          />
          <TextField
            label="Age"
            value={form.age}
            inputMode="numeric"
            suffix="years"
            onChange={(event) => patch({ age: event.target.value })}
            error={errors.age}
          />

          <SelectField
            label="Sex"
            value={form.sex}
            onChange={(event) => patch({ sex: event.target.value as Sex })}
            hint="Used in the energy estimate formula."
          >
            <option value="female">Female</option>
            <option value="male">Male</option>
            <option value="unspecified">Prefer not to say</option>
          </SelectField>

          <SelectField
            label="Units"
            value={form.units}
            onChange={(event) => changeUnits(event.target.value as Units)}
          >
            <option value="metric">Metric (kg, cm)</option>
            <option value="imperial">Imperial (lb, ft/in)</option>
          </SelectField>

          {form.units === "metric" ? (
            <TextField
              label="Height"
              value={form.heightCm}
              inputMode="numeric"
              suffix="cm"
              onChange={(event) => patch({ heightCm: event.target.value })}
              error={errors.height}
            />
          ) : (
            <div className={styles.heightRow}>
              <TextField
                label="Height (ft)"
                value={form.feet}
                inputMode="numeric"
                suffix="ft"
                onChange={(event) => patch({ feet: event.target.value })}
                error={errors.height}
              />
              <TextField
                label="Height (in)"
                value={form.inches}
                inputMode="numeric"
                suffix="in"
                onChange={(event) => patch({ inches: event.target.value })}
              />
            </div>
          )}

          <SelectField
            label="Activity level"
            value={profile.activityLevel}
            onChange={(event) =>
              onSave({ ...profile, activityLevel: event.target.value as ActivityLevel })
            }
          >
            {(Object.keys(ACTIVITY_LABELS) as ActivityLevel[]).map((level) => (
              <option key={level} value={level}>
                {ACTIVITY_LABELS[level]}
              </option>
            ))}
          </SelectField>

          <TextField
            label="Current weight"
            value={form.weight}
            inputMode="decimal"
            suffix={unitLabel}
            onChange={(event) => patch({ weight: event.target.value })}
            error={errors.weight}
            hint="Saving also adds today's weigh-in."
          />
          <TextField
            label="Goal weight"
            value={form.goalWeight}
            inputMode="decimal"
            suffix={unitLabel}
            onChange={(event) => patch({ goalWeight: event.target.value })}
            error={errors.goalWeight}
          />
        </div>

        <div className={styles.actions}>
          <Button type="submit" variant="primary">
            Save profile
          </Button>
          {saved ? (
            <span className={styles.savedNote}>
              <CheckIcon size={15} /> Saved
            </span>
          ) : null}
        </div>
      </form>
    </Card>
  );
}
