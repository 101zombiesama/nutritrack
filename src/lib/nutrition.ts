import type {
  ActivityLevel,
  DailyNutritionSummary,
  FoodItem,
  GoalKey,
  GoalMode,
  MacroKey,
  Meal,
  MealType,
  NutritionGoals,
  NutritionTotals,
  UserProfile,
} from "./types";

export const MEAL_TYPES: MealType[] = ["breakfast", "lunch", "dinner", "snacks"];

export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snacks: "Snacks",
};

export const MACRO_KEYS: MacroKey[] = ["protein", "carbs", "fat"];

export const MACRO_LABELS: Record<MacroKey, string> = {
  protein: "Protein",
  carbs: "Carbs",
  fat: "Fat",
};

/** kcal per gram, used to derive the macro split of a day's calories. */
export const KCAL_PER_GRAM: Record<MacroKey, number> = { protein: 4, carbs: 4, fat: 9 };

export function emptyTotals(): NutritionTotals {
  return { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
}

export function sumItems(items: FoodItem[]): NutritionTotals {
  return items.reduce<NutritionTotals>((acc, item) => {
    acc.calories += item.calories || 0;
    acc.protein += item.protein || 0;
    acc.carbs += item.carbs || 0;
    acc.fat += item.fat || 0;
    acc.fiber += item.fiber || 0;
    return acc;
  }, emptyTotals());
}

/** Meal totals are always derived from their food items - never stored separately. */
export function mealTotals(meal: Meal): NutritionTotals {
  return sumItems(meal.items);
}

export function addTotals(a: NutritionTotals, b: NutritionTotals): NutritionTotals {
  return {
    calories: a.calories + b.calories,
    protein: a.protein + b.protein,
    carbs: a.carbs + b.carbs,
    fat: a.fat + b.fat,
    fiber: a.fiber + b.fiber,
  };
}

export function totalsForMeals(meals: Meal[]): NutritionTotals {
  return meals.reduce((acc, meal) => addTotals(acc, mealTotals(meal)), emptyTotals());
}

export function mealsForDate(meals: Meal[], date: string): Meal[] {
  return meals
    .filter((meal) => meal.date === date)
    .sort((a, b) => a.loggedAt.localeCompare(b.loggedAt));
}

export function groupMealsByType(meals: Meal[]): Record<MealType, Meal[]> {
  const grouped = { breakfast: [], lunch: [], dinner: [], snacks: [] } as Record<MealType, Meal[]>;
  for (const meal of meals) grouped[meal.mealType].push(meal);
  return grouped;
}

export function dailySummary(meals: Meal[], date: string): DailyNutritionSummary {
  const dayMeals = mealsForDate(meals, date);
  return {
    date,
    totals: totalsForMeals(dayMeals),
    mealCount: dayMeals.length,
    hasData: dayMeals.length > 0,
  };
}

export function dailySummaries(meals: Meal[], dates: string[]): DailyNutritionSummary[] {
  const byDate = new Map<string, Meal[]>();
  for (const meal of meals) {
    const list = byDate.get(meal.date);
    if (list) list.push(meal);
    else byDate.set(meal.date, [meal]);
  }
  return dates.map((date) => {
    const dayMeals = byDate.get(date) ?? [];
    return {
      date,
      totals: totalsForMeals(dayMeals),
      mealCount: dayMeals.length,
      hasData: dayMeals.length > 0,
    };
  });
}

export type ProgressState = "empty" | "under" | "near" | "met" | "over";

export interface GoalProgress {
  key: GoalKey;
  mode: GoalMode;
  consumed: number;
  goal: number;
  /** Positive when there is headroom left, 0 once the goal is reached. */
  remaining: number;
  /** Positive only once the goal has been passed. */
  over: number;
  /** 0-100+, uncapped so callers can show overage. */
  percent: number;
  state: ProgressState;
}

export function goalProgress(
  key: GoalKey,
  consumed: number,
  goal: number,
  mode: GoalMode,
): GoalProgress {
  const safeGoal = goal > 0 ? goal : 0;
  const percent = safeGoal > 0 ? (consumed / safeGoal) * 100 : 0;
  const remaining = Math.max(0, safeGoal - consumed);
  const over = Math.max(0, consumed - safeGoal);

  let state: ProgressState = "under";
  if (consumed <= 0) state = "empty";
  else if (mode === "limit") {
    if (percent > 100) state = "over";
    else if (percent >= 85) state = "near";
  } else {
    if (percent > 110) state = "over";
    else if (percent >= 100) state = "met";
    else if (percent >= 85) state = "near";
  }

  return { key, mode, consumed, goal: safeGoal, remaining, over, percent, state };
}

export function progressForDay(totals: NutritionTotals, goals: NutritionGoals) {
  return {
    calories: goalProgress("calories", totals.calories, goals.calories, goals.modes.calories),
    protein: goalProgress("protein", totals.protein, goals.protein, goals.modes.protein),
    carbs: goalProgress("carbs", totals.carbs, goals.carbs, goals.modes.carbs),
    fat: goalProgress("fat", totals.fat, goals.fat, goals.modes.fat),
  };
}

/** Share of calories coming from each macro, normalised to 100%. */
export function macroDistribution(totals: NutritionTotals): Record<MacroKey, number> {
  const kcal = {
    protein: totals.protein * KCAL_PER_GRAM.protein,
    carbs: totals.carbs * KCAL_PER_GRAM.carbs,
    fat: totals.fat * KCAL_PER_GRAM.fat,
  };
  const sum = kcal.protein + kcal.carbs + kcal.fat;
  if (sum <= 0) return { protein: 0, carbs: 0, fat: 0 };
  return {
    protein: (kcal.protein / sum) * 100,
    carbs: (kcal.carbs / sum) * 100,
    fat: (kcal.fat / sum) * 100,
  };
}

export const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  athlete: 1.9,
};

export const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: "Sedentary - desk job, little exercise",
  light: "Light - exercise 1-3 days a week",
  moderate: "Moderate - exercise 3-5 days a week",
  active: "Active - exercise 6-7 days a week",
  athlete: "Very active - training twice a day",
};

/** Mifflin-St Jeor. An estimate, never presented as medical advice. */
export function basalMetabolicRate(profile: UserProfile): number {
  const base = 10 * profile.weightKg + 6.25 * profile.heightCm - 5 * profile.age;
  if (profile.sex === "male") return base + 5;
  if (profile.sex === "female") return base - 161;
  return base - 78;
}

export function maintenanceCalories(profile: UserProfile): number {
  return basalMetabolicRate(profile) * ACTIVITY_FACTORS[profile.activityLevel];
}

export interface SuggestedGoals extends NutritionGoals {
  rationale: string;
}

/**
 * A rough starting point derived from the profile: a gentle 15% deficit or 10%
 * surplus when a goal weight is set, protein at ~1.8g/kg and fat at ~28% of energy.
 */
export function suggestGoals(profile: UserProfile): SuggestedGoals {
  const maintenance = maintenanceCalories(profile);
  const diff = profile.goalWeightKg - profile.weightKg;
  let calories = maintenance;
  let direction = "maintain your current weight";
  if (diff <= -0.5) {
    calories = maintenance * 0.85;
    direction = "a gradual loss of about 0.4 kg a week";
  } else if (diff >= 0.5) {
    calories = maintenance * 1.1;
    direction = "a gradual gain of about 0.25 kg a week";
  }

  const proteinPerKg = diff <= -0.5 ? 2 : 1.8;
  const protein = Math.round((profile.weightKg * proteinPerKg) / 5) * 5;
  const fat = Math.round(((calories * 0.28) / 9) / 5) * 5;
  const carbCalories = calories - protein * 4 - fat * 9;
  const carbs = Math.max(50, Math.round(carbCalories / 4 / 5) * 5);

  return {
    calories: Math.round(calories / 10) * 10,
    protein,
    carbs,
    fat,
    modes: { calories: "limit", protein: "target", carbs: "limit", fat: "limit" },
    rationale: `Based on an estimated ${Math.round(maintenance)} kcal maintenance level for your profile and ${direction}.`,
  };
}

export function averageTotals(summaries: DailyNutritionSummary[]): NutritionTotals {
  const withData = summaries.filter((day) => day.hasData);
  if (withData.length === 0) return emptyTotals();
  const sum = withData.reduce((acc, day) => addTotals(acc, day.totals), emptyTotals());
  return {
    calories: sum.calories / withData.length,
    protein: sum.protein / withData.length,
    carbs: sum.carbs / withData.length,
    fat: sum.fat / withData.length,
    fiber: sum.fiber / withData.length,
  };
}

/** Days inside a +/-10% band around the calorie goal. */
export function daysWithinCalorieTarget(
  summaries: DailyNutritionSummary[],
  calorieGoal: number,
  tolerance = 0.1,
): { within: number; tracked: number } {
  const tracked = summaries.filter((day) => day.hasData);
  const within = tracked.filter((day) => {
    const delta = Math.abs(day.totals.calories - calorieGoal);
    return delta <= calorieGoal * tolerance;
  }).length;
  return { within, tracked: tracked.length };
}
