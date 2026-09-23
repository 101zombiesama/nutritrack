"use client";

import { useMemo, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { PlusIcon, TrashIcon } from "@/components/ui/Icons";
import { createId } from "@/lib/id";
import { formatGrams, formatNumber, parseNumber } from "@/lib/format";
import { MEAL_TYPES, MEAL_TYPE_LABELS } from "@/lib/nutrition";
import type { FoodItem, MealType } from "@/lib/types";
import styles from "./MealEditor.module.css";

export interface MealDraft {
  name: string;
  mealType: MealType;
  items: FoodItem[];
}

interface EditableItem {
  id: string;
  name: string;
  quantity: string;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
  fiber: string;
}

function toEditable(item: FoodItem): EditableItem {
  return {
    id: item.id || createId("food"),
    name: item.name,
    quantity: item.quantity,
    calories: String(Math.round(item.calories)),
    protein: String(item.protein),
    carbs: String(item.carbs),
    fat: String(item.fat),
    fiber: item.fiber ? String(item.fiber) : "",
  };
}

function toFoodItem(item: EditableItem): FoodItem {
  const fiber = parseNumber(item.fiber);
  return {
    id: item.id,
    name: item.name.trim() || "Food item",
    quantity: item.quantity.trim() || "1 serving",
    calories: Math.max(0, parseNumber(item.calories) ?? 0),
    protein: Math.max(0, parseNumber(item.protein) ?? 0),
    carbs: Math.max(0, parseNumber(item.carbs) ?? 0),
    fat: Math.max(0, parseNumber(item.fat) ?? 0),
    ...(fiber !== null ? { fiber: Math.max(0, fiber) } : {}),
  };
}

interface MealEditorProps {
  open: boolean;
  title: string;
  subtitle?: string;
  draft: MealDraft | null;
  saveLabel?: string;
  onSave: (draft: MealDraft) => void;
  onClose: () => void;
}

export function MealEditor({ open, draft, ...rest }: MealEditorProps) {
  // The dialog unmounts when closed, so each open starts from a fresh draft
  // without any prop-to-state syncing.
  if (!open || !draft) return null;
  return <MealEditorDialog draft={draft} {...rest} />;
}

function MealEditorDialog({
  title,
  subtitle,
  draft,
  saveLabel = "Save changes",
  onSave,
  onClose,
}: Omit<MealEditorProps, "open" | "draft"> & { draft: MealDraft }) {
  const [name, setName] = useState(draft.name);
  const [mealType, setMealType] = useState<MealType>(draft.mealType);
  const [items, setItems] = useState<EditableItem[]>(() => draft.items.map(toEditable));
  const [error, setError] = useState<string | null>(null);

  const totals = useMemo(() => {
    return items.reduce(
      (acc, item) => {
        acc.calories += parseNumber(item.calories) ?? 0;
        acc.protein += parseNumber(item.protein) ?? 0;
        acc.carbs += parseNumber(item.carbs) ?? 0;
        acc.fat += parseNumber(item.fat) ?? 0;
        return acc;
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 },
    );
  }, [items]);

  const patchItem = (id: string, patch: Partial<EditableItem>) => {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const handleSave = () => {
    if (!name.trim()) {
      setError("Give this meal a name so you can recognise it later.");
      return;
    }
    if (items.length === 0) {
      setError("Add at least one food item.");
      return;
    }
    onSave({ name: name.trim(), mealType, items: items.map(toFoodItem) });
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave}>
            {saveLabel}
          </Button>
        </>
      }
    >
      <div className={styles.form}>
        <div className={styles.topRow}>
          <div className={styles.miniField}>
            <label className={styles.miniLabel} htmlFor="meal-name">
              Meal name
            </label>
            <input
              id="meal-name"
              className={styles.input}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Chicken burrito bowl"
            />
          </div>
          <div className={styles.miniField}>
            <label className={styles.miniLabel} htmlFor="meal-type">
              Meal
            </label>
            <select
              id="meal-type"
              className={styles.input}
              value={mealType}
              onChange={(event) => setMealType(event.target.value as MealType)}
            >
              {MEAL_TYPES.map((type) => (
                <option key={type} value={type}>
                  {MEAL_TYPE_LABELS[type]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.itemsHead}>
          <span className={styles.sectionLabel}>Food items</span>
          <span className={styles.note}>Adjust anything that looks off</span>
        </div>

        <div className={styles.items}>
          {items.map((item) => (
            <div key={item.id} className={styles.item}>
              <div className={styles.itemTop}>
                <input
                  className={styles.input}
                  value={item.name}
                  onChange={(event) => patchItem(item.id, { name: event.target.value })}
                  aria-label="Food name"
                  placeholder="Food"
                />
                <input
                  className={styles.input}
                  value={item.quantity}
                  onChange={(event) => patchItem(item.id, { quantity: event.target.value })}
                  aria-label="Quantity"
                  placeholder="150 g"
                />
                <button
                  type="button"
                  className={styles.removeButton}
                  onClick={() => setItems((current) => current.filter((row) => row.id !== item.id))}
                  aria-label={`Remove ${item.name || "item"}`}
                >
                  <TrashIcon size={16} />
                </button>
              </div>

              <div className={styles.macroGrid}>
                {([
                  ["calories", "kcal"],
                  ["protein", "Protein g"],
                  ["carbs", "Carbs g"],
                  ["fat", "Fat g"],
                ] as const).map(([field, label]) => (
                  <div key={field} className={styles.miniField}>
                    <label className={styles.miniLabel} htmlFor={`${item.id}-${field}`}>
                      {label}
                    </label>
                    <input
                      id={`${item.id}-${field}`}
                      className={`${styles.input} ${styles.numberInput}`}
                      value={item[field]}
                      inputMode="decimal"
                      onChange={(event) => patchItem(item.id, { [field]: event.target.value })}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          className={styles.addItem}
          onClick={() =>
            setItems((current) => [
              ...current,
              {
                id: createId("food"),
                name: "",
                quantity: "1 serving",
                calories: "0",
                protein: "0",
                carbs: "0",
                fat: "0",
                fiber: "",
              },
            ])
          }
        >
          <PlusIcon size={15} /> Add food item
        </button>

        <div className={styles.totals}>
          <div className={styles.total}>
            <span className={styles.totalLabel}>Calories</span>
            <span className={`${styles.totalValue} tabular`}>{formatNumber(totals.calories)}</span>
          </div>
          <div className={styles.total}>
            <span className={styles.totalLabel}>Protein</span>
            <span className={`${styles.totalValue} tabular`}>{formatGrams(totals.protein)}</span>
          </div>
          <div className={styles.total}>
            <span className={styles.totalLabel}>Carbs</span>
            <span className={`${styles.totalValue} tabular`}>{formatGrams(totals.carbs)}</span>
          </div>
          <div className={styles.total}>
            <span className={styles.totalLabel}>Fat</span>
            <span className={`${styles.totalValue} tabular`}>{formatGrams(totals.fat)}</span>
          </div>
        </div>

        {error ? (
          <p className={styles.error} role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </Modal>
  );
}
