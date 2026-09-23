export type MealType = "breakfast" | "lunch" | "dinner" | "snacks";

export type MacroKey = "protein" | "carbs" | "fat";

export type GoalKey = "calories" | MacroKey;

/** "target" = something to reach, "limit" = a ceiling to stay under. */
export type GoalMode = "target" | "limit";

export type Confidence = "high" | "medium" | "low";

export type Sex = "female" | "male" | "unspecified";

export type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "athlete";

export type Units = "metric" | "imperial";

export type ThemePreference = "light" | "dark" | "system";

export interface FoodItem {
  id: string;
  name: string;
  /** Human readable serving, e.g. "150 g", "1 cup", "1/2 avocado". */
  quantity: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
}

export interface NutritionTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

export interface Meal {
  id: string;
  /** YYYY-MM-DD in local time. */
  date: string;
  mealType: MealType;
  name: string;
  items: FoodItem[];
  /** ISO timestamp of when the meal was logged. */
  loggedAt: string;
  source: "ai" | "manual";
  confidence?: Confidence;
  note?: string;
}

export interface NutritionGoals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  modes: Record<GoalKey, GoalMode>;
}

export interface UserProfile {
  name: string;
  age: number;
  sex: Sex;
  heightCm: number;
  weightKg: number;
  goalWeightKg: number;
  activityLevel: ActivityLevel;
  units: Units;
}

export interface WeightEntry {
  id: string;
  /** YYYY-MM-DD */
  date: string;
  weightKg: number;
}

export interface Preferences {
  theme: ThemePreference;
  mealReminders: boolean;
  weeklySummary: boolean;
  showEstimateBadges: boolean;
}

export interface DailyNutritionSummary {
  date: string;
  totals: NutritionTotals;
  mealCount: number;
  hasData: boolean;
}

export interface NutritionAnalysis {
  id: string;
  mealName: string;
  mealType: MealType;
  items: FoodItem[];
  totals: NutritionTotals;
  confidence: Confidence;
  /** Plain-language notes about what was assumed, shown to the user. */
  assumptions: string[];
  /** Echo of what the user typed, so "Try again" can re-run it. */
  sourceText: string;
}

export type ChatMessageKind = "text" | "analysis" | "error";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  kind: ChatMessageKind;
  createdAt: string;
  text?: string;
  analysis?: NutritionAnalysis;
  analysisState?: "pending" | "saved" | "discarded";
  savedMealId?: string;
  errorMessage?: string;
  /** Description to re-send when the user taps "Try again". */
  retryText?: string;
}

export interface AppData {
  version: number;
  profile: UserProfile;
  goals: NutritionGoals;
  meals: Meal[];
  weights: WeightEntry[];
  chat: ChatMessage[];
  preferences: Preferences;
}
