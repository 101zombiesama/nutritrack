"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CalorieSummary } from "@/components/dashboard/CalorieSummary";
import { MacroCards } from "@/components/dashboard/MacroCards";
import { MealList } from "@/components/dashboard/MealList";
import { MealEditor, type MealDraft } from "@/components/meals/MealEditor";
import { Card } from "@/components/ui/Card";
import { InfoIcon, FlameIcon, LeafIcon, SparkIcon, TargetIcon } from "@/components/ui/Icons";
import { useToast } from "@/components/ui/Toast";
import { formatLongDate, greetingForHour, todayISO } from "@/lib/dates";
import { formatGrams, formatNumber } from "@/lib/format";
import { createId } from "@/lib/id";
import { dailySummary, mealsForDate, progressForDay } from "@/lib/nutrition";
import type { Meal, MealType } from "@/lib/types";
import { useApp } from "@/state/AppProvider";
import styles from "./page.module.css";

type EditorState =
  | { mode: "edit"; meal: Meal; draft: MealDraft }
  | { mode: "create"; mealType: MealType; draft: MealDraft }
  | null;

export default function TodayPage() {
  const { data, updateMeal, deleteMeal, addMeal } = useApp();
  const { showToast } = useToast();
  const [editor, setEditor] = useState<EditorState>(null);

  const today = todayISO();
  const todaysMeals = useMemo(() => mealsForDate(data.meals, today), [data.meals, today]);
  const summary = useMemo(() => dailySummary(data.meals, today), [data.meals, today]);
  const progress = useMemo(() => progressForDay(summary.totals, data.goals), [summary, data.goals]);

  const openEdit = (meal: Meal) => {
    setEditor({
      mode: "edit",
      meal,
      draft: { name: meal.name, mealType: meal.mealType, items: meal.items },
    });
  };

  const openCreate = (mealType: MealType) => {
    setEditor({
      mode: "create",
      mealType,
      draft: {
        name: "",
        mealType,
        items: [
          {
            id: createId("food"),
            name: "",
            quantity: "1 serving",
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0,
          },
        ],
      },
    });
  };

  const handleDelete = (meal: Meal) => {
    deleteMeal(meal.id);
    showToast(`${meal.name} removed`, {
      action: { label: "Undo", onClick: () => addMeal(meal) },
    });
  };

  const handleSave = (draft: MealDraft) => {
    if (!editor) return;
    if (editor.mode === "edit") {
      updateMeal({ ...editor.meal, name: draft.name, mealType: draft.mealType, items: draft.items });
      showToast("Meal updated");
    } else {
      addMeal({
        id: createId("meal"),
        date: today,
        mealType: draft.mealType,
        name: draft.name,
        items: draft.items,
        loggedAt: new Date().toISOString(),
        source: "manual",
      });
      showToast("Meal added to today");
    }
    setEditor(null);
  };

  const remainingCopy =
    progress.calories.over > 0
      ? `You're ${formatNumber(progress.calories.over)} kcal past your goal today - it happens.`
      : summary.mealCount === 0
        ? "Nothing logged yet. Tell NutriTrack what you ate."
        : `${formatNumber(progress.calories.remaining)} kcal left for today.`;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.date}>{formatLongDate(today)}</p>
          <h1 className={styles.greeting}>
            {greetingForHour()}, {data.profile.name || "there"}
          </h1>
          <p className={styles.subline}>{remainingCopy}</p>
        </div>
        <Link href="/log" className={styles.logButton}>
          <SparkIcon size={18} />
          Log food
        </Link>
      </header>

      <CalorieSummary progress={progress.calories} mealCount={summary.mealCount} />

      <div className={styles.sectionTitle}>
        <h2 className={styles.sectionHeading}>Macros</h2>
        <span className={styles.sectionNote}>Against today&rsquo;s targets</span>
      </div>

      <MacroCards
        progress={{ protein: progress.protein, carbs: progress.carbs, fat: progress.fat }}
      />

      <div className={styles.extras}>
        <Card className={styles.extraCard}>
          <span className={styles.extraIcon}>
            <LeafIcon size={19} />
          </span>
          <span className={styles.extraText}>
            <span className={`${styles.extraValue} tabular`}>{formatGrams(summary.totals.fiber)}</span>
            <span className={styles.extraLabel}>Fiber today</span>
          </span>
        </Card>
        <Card className={styles.extraCard}>
          <span className={styles.extraIcon}>
            {progress.calories.over > 0 ? <FlameIcon size={19} /> : <TargetIcon size={19} />}
          </span>
          <span className={styles.extraText}>
            <span className={`${styles.extraValue} tabular`}>
              {formatNumber(progress.calories.percent)}%
            </span>
            <span className={styles.extraLabel}>of your calorie goal</span>
          </span>
        </Card>
      </div>

      <MealList
        meals={todaysMeals}
        onEdit={openEdit}
        onDelete={handleDelete}
        onAdd={openCreate}
        showEstimateBadges={data.preferences.showEstimateBadges}
      />

      <p className={styles.footnote}>
        <InfoIcon size={15} />
        Nutrition values from the AI log are estimates. Edit any meal to correct them.
      </p>

      <MealEditor
        open={editor !== null}
        title={editor?.mode === "create" ? "Add a meal" : "Edit meal"}
        subtitle={
          editor?.mode === "create"
            ? "Enter what you ate and its nutrition."
            : "Correct anything that looks off - totals update as you type."
        }
        draft={editor?.draft ?? null}
        saveLabel={editor?.mode === "create" ? "Add meal" : "Save changes"}
        onSave={handleSave}
        onClose={() => setEditor(null)}
      />
    </div>
  );
}
