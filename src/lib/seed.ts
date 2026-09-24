import { addDays, todayISO } from "./dates";
import { createId } from "./id";
import { analyzeMealLocally } from "@/services/nutritionService";
import type { AppData, Meal, MealType, WeightEntry } from "./types";

/** Deterministic PRNG so the demo history looks the same on every install. */
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const TEMPLATES: Record<MealType, string[]> = {
  breakfast: [
    "2 scrambled eggs, 2 slices of sourdough toast with butter and a latte",
    "200g greek yogurt with 1 cup berries, 30g granola and honey",
    "1 cup oatmeal with a banana, 20g almonds and a black coffee",
    "3 boiled eggs, avocado toast and an orange juice",
    "protein shake with 250ml milk and a banana",
    "2 pancakes with honey and a cappuccino",
  ],
  lunch: [
    "chicken burrito bowl with rice, black beans, avocado and salsa",
    "chicken sandwich with a side salad and an apple",
    "150g salmon with 1 cup quinoa and roasted vegetables",
    "2 slices of pizza and a green salad",
    "tuna salad with 2 boiled eggs, hummus and a slice of bread",
    "chicken curry with 1 cup rice",
    "turkey wrap with mixed salad and 30g crisps",
  ],
  dinner: [
    "170g steak with a baked potato and broccoli",
    "150g chicken breast with 1 cup brown rice and mixed vegetables",
    "pasta with ground beef, tomato and 30g cheese",
    "pad thai with shrimp",
    "150g tofu stir fry with 1 cup rice and vegetables",
    "2 sushi rolls with edamame and a green tea",
    "lentil soup with 2 slices of bread and a glass of wine",
  ],
  snacks: [
    "a protein bar",
    "20g almonds and an apple",
    "greek yogurt with berries",
    "30g dark chocolate",
    "a cookie and a black coffee",
    "protein shake",
  ],
};

const MEAL_HOURS: Record<MealType, number> = { breakfast: 8, lunch: 12, dinner: 19, snacks: 16 };

function buildMeal(
  date: string,
  mealType: MealType,
  description: string,
  rand: () => number,
  forcedHour?: number,
): Meal {
  const analysis = analyzeMealLocally({ description, mealTypeHint: mealType });
  const hour = forcedHour ?? MEAL_HOURS[mealType] + Math.floor(rand() * 2);
  const minute = Math.floor(rand() * 60);
  const [y, m, d] = date.split("-").map(Number);
  const loggedAt = new Date(y, m - 1, d, hour, minute).toISOString();

  return {
    id: createId("meal"),
    date,
    mealType,
    name: analysis.mealName,
    items: analysis.items,
    loggedAt,
    source: "ai",
    confidence: analysis.confidence,
  };
}

function seedMeals(days: number, rand: () => number): Meal[] {
  const meals: Meal[] = [];
  const today = todayISO();

  for (let offset = days - 1; offset >= 1; offset -= 1) {
    const date = addDays(today, -offset);
    // A couple of untracked days keeps the trends honest.
    if (offset > 3 && rand() < 0.07) continue;

    const slots: MealType[] = ["breakfast", "lunch", "dinner"];
    if (rand() < 0.55) slots.push("snacks");

    for (const slot of slots) {
      const options = TEMPLATES[slot];
      const description = options[Math.floor(rand() * options.length)];
      meals.push(buildMeal(date, slot, description, rand));
    }
  }

  // Today is deliberately part-way through: only slots whose usual time has
  // already passed are logged, so the day always looks in-progress.
  const nowHour = new Date().getHours();
  const todaySlots: Array<[MealType, string]> = [
    ["breakfast", TEMPLATES.breakfast[0]],
    ["lunch", TEMPLATES.lunch[0]],
    ["snacks", TEMPLATES.snacks[1]],
  ];

  let logged = 0;
  for (const [slot, description] of todaySlots) {
    if (MEAL_HOURS[slot] > nowHour) continue;
    meals.push(buildMeal(today, slot, description, rand));
    logged += 1;
  }
  if (logged === 0) {
    // Very early in the morning - still show one entry rather than a blank day.
    meals.push(buildMeal(today, "breakfast", TEMPLATES.breakfast[0], rand, Math.max(0, nowHour - 1)));
  }

  return meals;
}

function seedWeights(days: number, start: number, end: number, rand: () => number): WeightEntry[] {
  const entries: WeightEntry[] = [];
  const today = todayISO();
  for (let offset = days - 1; offset >= 0; offset -= 3) {
    const progress = 1 - offset / days;
    const trend = start + (end - start) * progress;
    const noise = (rand() - 0.5) * 0.6;
    entries.push({
      id: createId("weight"),
      date: addDays(today, -offset),
      weightKg: Math.round((trend + noise) * 10) / 10,
    });
  }
  return entries;
}

export const WELCOME_MESSAGE_TEXT =
  "Hi Alex - tell me what you ate and I'll estimate the nutrition. You can write it however you like, for example \"2 eggs, toast with butter and a latte\".";

export function createSeedData(): AppData {
  const rand = mulberry32(20260923);
  const historyDays = 92;
  const weights = seedWeights(historyDays, 78.1, 74.2, rand);
  const currentWeight = weights[weights.length - 1]?.weightKg ?? 74.2;

  return {
    version: 1,
    demo: true,
    seededOn: todayISO(),
    profile: {
      name: "Alex",
      age: 31,
      sex: "female",
      heightCm: 170,
      weightKg: currentWeight,
      goalWeightKg: 69,
      activityLevel: "moderate",
      units: "metric",
    },
    goals: {
      calories: 2200,
      protein: 160,
      carbs: 230,
      fat: 70,
      modes: { calories: "limit", protein: "target", carbs: "limit", fat: "limit" },
    },
    meals: seedMeals(historyDays, rand),
    weights,
    chat: [
      {
        id: createId("msg"),
        role: "assistant",
        kind: "text",
        createdAt: new Date().toISOString(),
        text: WELCOME_MESSAGE_TEXT,
      },
    ],
    preferences: {
      theme: "system",
      mealReminders: true,
      weeklySummary: true,
      showEstimateBadges: true,
    },
  };
}
