"use client";

import { GoalsForm } from "@/components/profile/GoalsForm";
import { PreferencesPanel } from "@/components/profile/PreferencesPanel";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { WeightPanel } from "@/components/profile/WeightPanel";
import { useToast } from "@/components/ui/Toast";
import { formatHeight, formatNumber } from "@/lib/format";
import type { UserProfile } from "@/lib/types";
import { useApp } from "@/state/AppProvider";
import styles from "./page.module.css";

export default function ProfilePage() {
  const { data, setProfile, setGoals, setPreferences, logWeight, deleteWeight, resetDemoData } =
    useApp();
  const { showToast } = useToast();

  const handleProfileSave = (profile: UserProfile) => {
    setProfile(profile);
    if (Math.abs(profile.weightKg - data.profile.weightKg) > 0.05) {
      logWeight(profile.weightKg);
    }
    showToast("Profile saved");
  };

  const initials = data.profile.name.trim().charAt(0).toUpperCase() || "N";

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <span className={styles.avatar} aria-hidden="true">
          {initials}
        </span>
        <div>
          <h1 className={styles.title}>{data.profile.name || "Your profile"}</h1>
          <p className={styles.subtitle}>
            {data.profile.age} · {formatHeight(data.profile.heightCm, data.profile.units)} ·{" "}
            {formatNumber(data.goals.calories)} kcal daily goal
          </p>
        </div>
      </header>

      <ProfileForm profile={data.profile} onSave={handleProfileSave} />

      <GoalsForm
        goals={data.goals}
        profile={data.profile}
        onSave={(goals) => {
          setGoals(goals);
          showToast("Goals updated");
        }}
      />

      <WeightPanel
        profile={data.profile}
        entries={data.weights}
        onLog={(weightKg) => {
          logWeight(weightKg);
          setProfile({ ...data.profile, weightKg });
          showToast("Weigh-in added");
        }}
        onDelete={(id) => {
          deleteWeight(id);
          showToast("Weigh-in removed");
        }}
      />

      <PreferencesPanel
        preferences={data.preferences}
        onChange={setPreferences}
        onReset={() => {
          resetDemoData();
          showToast("Demo data restored");
        }}
      />
    </div>
  );
}
