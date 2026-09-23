"use client";

import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { PencilIcon, PlusIcon, SparkIcon, TrashIcon } from "@/components/ui/Icons";
import { formatTime } from "@/lib/dates";
import { formatGrams, formatNumber } from "@/lib/format";
import { MACRO_LABELS, MEAL_TYPES, MEAL_TYPE_LABELS, groupMealsByType, mealTotals } from "@/lib/nutrition";
import type { MacroKey, Meal, MealType } from "@/lib/types";
import { MACRO_COLORS } from "./MacroCards";
import styles from "./MealList.module.css";

interface MealListProps {
  meals: Meal[];
  onEdit: (meal: Meal) => void;
  onDelete: (meal: Meal) => void;
  onAdd: (mealType: MealType) => void;
  showEstimateBadges: boolean;
}

export function MealList({ meals, onEdit, onDelete, onAdd, showEstimateBadges }: MealListProps) {
  const grouped = groupMealsByType(meals);
  const dayTotal = meals.reduce((sum, meal) => sum + mealTotals(meal).calories, 0);

  return (
    <Card padding="large" as="section">
      <div className={styles.headerRow}>
        <div>
          <h2 style={{ fontSize: "1.05rem" }}>Today&rsquo;s meals</h2>
          <p style={{ fontSize: "0.82rem", color: "var(--text-3)" }}>
            {meals.length === 0
              ? "Your log is empty"
              : `${meals.length} ${meals.length === 1 ? "entry" : "entries"} · ${formatNumber(dayTotal)} kcal`}
          </p>
        </div>
        <Link
          href="/log"
          className={styles.addRow}
          style={{ width: "auto", borderStyle: "solid", color: "var(--brand)", borderColor: "var(--border-strong)" }}
        >
          <SparkIcon size={16} /> Log food
        </Link>
      </div>

      {meals.length === 0 ? (
        <EmptyState
          icon={<SparkIcon size={20} />}
          title="Nothing logged yet"
          description="Tell NutriTrack what you ate and we'll estimate the nutrition for you."
          action={
            <Link href="/log" className={styles.addRow} style={{ width: "auto", justifyContent: "center" }}>
              <PlusIcon size={16} /> Log your first meal
            </Link>
          }
        />
      ) : (
        <div className={styles.groups}>
          {MEAL_TYPES.map((type) => {
            const group = grouped[type];
            const groupCalories = group.reduce((sum, meal) => sum + mealTotals(meal).calories, 0);

            return (
              <section key={type} className={styles.group}>
                <div className={styles.groupHead}>
                  <h3 className={styles.groupName}>{MEAL_TYPE_LABELS[type]}</h3>
                  {group.length > 0 ? (
                    <span className={`${styles.groupTotal} tabular`}>{formatNumber(groupCalories)} kcal</span>
                  ) : null}
                </div>

                {group.length === 0 ? (
                  <button type="button" className={styles.addRow} onClick={() => onAdd(type)}>
                    <PlusIcon size={15} />
                    Add {MEAL_TYPE_LABELS[type].toLowerCase()}
                  </button>
                ) : (
                  group.map((meal) => (
                    <MealRow
                      key={meal.id}
                      meal={meal}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      showEstimateBadges={showEstimateBadges}
                    />
                  ))
                )}
              </section>
            );
          })}
        </div>
      )}
    </Card>
  );
}

function MealRow({
  meal,
  onEdit,
  onDelete,
  showEstimateBadges,
}: {
  meal: Meal;
  onEdit: (meal: Meal) => void;
  onDelete: (meal: Meal) => void;
  showEstimateBadges: boolean;
}) {
  const totals = mealTotals(meal);

  return (
    <article className={styles.meal}>
      <div className={styles.mealTop}>
        <div className={styles.mealTitle}>
          <h4 className={styles.mealName}>{meal.name}</h4>
          <div className={styles.mealMeta}>
            <span>{formatTime(meal.loggedAt)}</span>
            {showEstimateBadges && meal.source === "ai" ? (
              <Badge tone="outline">Estimated</Badge>
            ) : null}
          </div>
        </div>
        <div className={styles.actions}>
          <span className={`${styles.calories} tabular`}>
            {formatNumber(totals.calories)}
            <span className={styles.caloriesUnit}>kcal</span>
          </span>
          <button
            type="button"
            className={styles.iconButton}
            onClick={() => onEdit(meal)}
            aria-label={`Edit ${meal.name}`}
          >
            <PencilIcon size={16} />
          </button>
          <button
            type="button"
            className={`${styles.iconButton} ${styles.deleteButton}`}
            onClick={() => onDelete(meal)}
            aria-label={`Delete ${meal.name}`}
          >
            <TrashIcon size={16} />
          </button>
        </div>
      </div>

      <div className={styles.macros}>
        {(Object.keys(MACRO_LABELS) as MacroKey[]).map((key) => (
          <span key={key} className={styles.macro}>
            <span
              className={styles.macroDot}
              style={{ ["--macro-color" as string]: MACRO_COLORS[key] }}
              aria-hidden="true"
            />
            {MACRO_LABELS[key]} <strong className="tabular">{formatGrams(totals[key])}</strong>
          </span>
        ))}
      </div>

      {meal.items.length > 0 ? (
        <p className={styles.items}>
          {meal.items.map((item) => `${item.name} (${item.quantity})`).join(" · ")}
        </p>
      ) : null}
    </article>
  );
}
