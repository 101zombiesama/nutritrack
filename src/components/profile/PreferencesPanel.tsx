"use client";

import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { ToggleField } from "@/components/ui/Field";
import type { Preferences, ThemePreference } from "@/lib/types";
import styles from "./forms.module.css";

interface PreferencesPanelProps {
  preferences: Preferences;
  onChange: (preferences: Partial<Preferences>) => void;
  onReset: () => void;
}

const THEME_OPTIONS = [
  { value: "light" as const, label: "Light" },
  { value: "dark" as const, label: "Dark" },
  { value: "system" as const, label: "System" },
];

export function PreferencesPanel({ preferences, onChange, onReset }: PreferencesPanelProps) {
  return (
    <Card padding="large" as="section">
      <CardHeader title="App preferences" subtitle="Everything is stored on this device." />

      <div className={styles.weightRow} style={{ gridTemplateColumns: "1fr auto", alignItems: "center" }}>
        <div>
          <p style={{ fontSize: "0.9rem", fontWeight: 560 }}>Appearance</p>
          <p style={{ fontSize: "0.78rem", color: "var(--text-3)" }}>
            Follow your system setting or pick one.
          </p>
        </div>
        <SegmentedControl
          options={THEME_OPTIONS}
          value={preferences.theme}
          onChange={(theme: ThemePreference) => onChange({ theme })}
          ariaLabel="Theme"
        />
      </div>

      <div style={{ marginTop: 8 }}>
        <ToggleField
          label="Meal reminders"
          description="A nudge if breakfast, lunch or dinner isn't logged."
          checked={preferences.mealReminders}
          onChange={(value) => onChange({ mealReminders: value })}
        />
        <ToggleField
          label="Weekly summary"
          description="A recap of your averages every Sunday."
          checked={preferences.weeklySummary}
          onChange={(value) => onChange({ weeklySummary: value })}
        />
        <ToggleField
          label='Show "Estimated" badges'
          description="Marks meals whose nutrition came from the AI estimate."
          checked={preferences.showEstimateBadges}
          onChange={(value) => onChange({ showEstimateBadges: value })}
        />
      </div>

      <div className={styles.dangerRow}>
        <p className={styles.dangerText}>
          Reset clears everything you&rsquo;ve logged on this device and restores the sample data.
        </p>
        <Button variant="danger" onClick={onReset}>
          Reset demo data
        </Button>
      </div>
    </Card>
  );
}
