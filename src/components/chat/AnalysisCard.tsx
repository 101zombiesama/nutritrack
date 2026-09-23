"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { CheckIcon, PencilIcon, PlusIcon, RefreshIcon } from "@/components/ui/Icons";
import { formatGrams, formatNumber } from "@/lib/format";
import { MEAL_TYPE_LABELS } from "@/lib/nutrition";
import type { ChatMessage, NutritionAnalysis } from "@/lib/types";
import styles from "./AnalysisCard.module.css";

const CONFIDENCE_COPY: Record<NutritionAnalysis["confidence"], string> = {
  high: "High confidence",
  medium: "Rough estimate",
  low: "Low confidence",
};

interface AnalysisCardProps {
  analysis: NutritionAnalysis;
  state: ChatMessage["analysisState"];
  onAdd: () => void;
  onEdit: () => void;
  onRetry: () => void;
}

export function AnalysisCard({ analysis, state, onAdd, onEdit, onRetry }: AnalysisCardProps) {
  const saved = state === "saved";

  return (
    <div className={styles.card}>
      <div className={styles.head}>
        <div className={styles.titleGroup}>
          <h3 className={styles.title}>{analysis.mealName}</h3>
          <div className={styles.subtitle}>
            <span>Estimated nutrition</span>
            <span aria-hidden="true">·</span>
            <span>{MEAL_TYPE_LABELS[analysis.mealType]}</span>
          </div>
        </div>
        <Badge tone={analysis.confidence === "high" ? "brand" : analysis.confidence === "medium" ? "neutral" : "warning"}>
          {CONFIDENCE_COPY[analysis.confidence]}
        </Badge>
      </div>

      <div className={styles.totals}>
        <div className={styles.total}>
          <span className={styles.totalLabel}>Calories</span>
          <span className={`${styles.totalValue} tabular`}>{formatNumber(analysis.totals.calories)}</span>
        </div>
        <div className={styles.total}>
          <span className={styles.totalLabel}>
            <span className={styles.dot} style={{ ["--dot-color" as string]: "var(--protein)" }} />
            Protein
          </span>
          <span className={`${styles.totalValue} tabular`}>{formatGrams(analysis.totals.protein)}</span>
        </div>
        <div className={styles.total}>
          <span className={styles.totalLabel}>
            <span className={styles.dot} style={{ ["--dot-color" as string]: "var(--carbs)" }} />
            Carbs
          </span>
          <span className={`${styles.totalValue} tabular`}>{formatGrams(analysis.totals.carbs)}</span>
        </div>
        <div className={styles.total}>
          <span className={styles.totalLabel}>
            <span className={styles.dot} style={{ ["--dot-color" as string]: "var(--fat)" }} />
            Fat
          </span>
          <span className={`${styles.totalValue} tabular`}>{formatGrams(analysis.totals.fat)}</span>
        </div>
      </div>

      <div>
        <p className={styles.itemsLabel}>Detected</p>
        <ul className={styles.items} style={{ marginTop: 8 }}>
          {analysis.items.map((item) => (
            <li key={item.id} className={styles.item}>
              <span className={styles.itemName}>{item.name}</span>
              <span className={styles.itemMeta}>
                <span>{item.quantity}</span>
                <span className="tabular">{formatNumber(item.calories)} kcal</span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      {analysis.assumptions.length > 0 && !saved ? (
        <div className={styles.assumptions}>
          {analysis.assumptions.map((assumption) => (
            <span key={assumption}>{assumption}</span>
          ))}
        </div>
      ) : null}

      {saved ? (
        <div className={styles.savedRow}>
          <CheckIcon size={16} />
          Added to today
          <Link href="/" className={styles.savedLink}>
            View dashboard
          </Link>
        </div>
      ) : state === "discarded" ? (
        <p className={styles.discarded}>Replaced by a newer estimate below.</p>
      ) : (
        <div className={styles.actions}>
          <Button variant="primary" onClick={onAdd}>
            <PlusIcon size={16} /> Add to today
          </Button>
          <Button variant="secondary" onClick={onEdit}>
            <PencilIcon size={16} /> Edit
          </Button>
          <Button variant="ghost" onClick={onRetry}>
            <RefreshIcon size={16} /> Try again
          </Button>
        </div>
      )}
    </div>
  );
}
