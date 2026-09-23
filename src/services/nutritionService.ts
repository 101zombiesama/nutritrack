import { createId } from "@/lib/id";
import { mealTypeForHour } from "@/lib/dates";
import { sumItems } from "@/lib/nutrition";
import type { Confidence, FoodItem, MealType, NutritionAnalysis } from "@/lib/types";
import {
  findDishPhrase,
  findFood,
  type FoodDefinition,
  type ServingUnit,
} from "./foodDatabase";

/* ------------------------------------------------------------------ *
 * Public interface
 *
 * This is the seam between the app and nutrition intelligence. Today a
 * mock implementation answers; tomorrow `createHttpNutritionService()`
 * points at POST /api/nutrition/analyze and nothing else changes.
 * Any provider credentials live on that server route, never here.
 * ------------------------------------------------------------------ */

export interface AnalyzeMealRequest {
  description: string;
  /** Slot the user is logging into, when they have already picked one. */
  mealTypeHint?: MealType;
  /** ISO timestamp of the log, used to guess the meal slot. */
  loggedAt?: string;
  /** Recent user messages, so a follow-up like "make that two" has context. */
  history?: string[];
}

export interface AnalyzeMealResponse {
  analysis: NutritionAnalysis;
}

export interface NutritionService {
  analyzeMeal(request: AnalyzeMealRequest): Promise<AnalyzeMealResponse>;
}

export type AnalysisErrorCode =
  | "empty_input"
  | "no_food_detected"
  | "service_unavailable"
  | "malformed_response";

export class NutritionAnalysisError extends Error {
  readonly code: AnalysisErrorCode;
  readonly retryable: boolean;

  constructor(code: AnalysisErrorCode, message: string, retryable = true) {
    super(message);
    this.name = "NutritionAnalysisError";
    this.code = code;
    this.retryable = retryable;
  }
}

/* ------------------------------------------------------------------ *
 * Parsing helpers
 * ------------------------------------------------------------------ */

const NUMBER_WORDS: Record<string, number> = {
  a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6,
  seven: 7, eight: 8, nine: 9, ten: 10, twelve: 12, half: 0.5, couple: 2,
};

const SIZE_WORDS: Record<string, number> = {
  small: 0.75, little: 0.75, medium: 1, regular: 1, big: 1.35, large: 1.35, huge: 1.6,
};

const MASS_UNITS: Record<string, number> = {
  g: 1, gram: 1, grams: 1, gr: 1, kg: 1000, kilo: 1000, kilos: 1000,
  oz: 28.3495, ounce: 28.3495, ounces: 28.3495, lb: 453.592, lbs: 453.592, pound: 453.592,
};

const VOLUME_UNITS: Record<string, ServingUnit> = {
  ml: "ml", milliliter: "ml", milliliters: "ml", l: "ml", litre: "ml", liter: "ml",
  cup: "cup", cups: "cup", tbsp: "tbsp", tablespoon: "tbsp", tablespoons: "tbsp",
  tsp: "tsp", teaspoon: "tsp", teaspoons: "tsp", slice: "slice", slices: "slice",
  scoop: "scoop", scoops: "scoop", piece: "piece", pieces: "piece",
};

const STOP_WORDS = new Set([
  "i", "had", "ate", "eat", "eating", "for", "with", "and", "a", "an", "the", "of",
  "some", "my", "me", "just", "today", "this", "morning", "afternoon", "evening",
  "then", "also", "plus", "about", "around", "roughly", "approx", "approximately",
  "log", "add", "track", "please", "breakfast", "lunch", "dinner", "snack", "meal",
  "was", "were", "it", "to", "on", "in", "at", "we", "our", "from",
]);

/**
 * Words that describe the vessel rather than a food. Left in, "burrito bowl"
 * would match the composed "burrito" entry on top of its listed ingredients.
 */
const CONTAINER_PHRASES = [
  "burrito bowl",
  "rice bowl",
  "grain bowl",
  "poke bowl",
  "smoothie bowl",
  "acai bowl",
  "bowl of",
  "plate of",
  "side of",
  "serving of",
  "portion of",
];

function stripContainers(text: string): string {
  return CONTAINER_PHRASES.reduce(
    (acc, phrase) => acc.split(phrase).join(" "),
    text,
  ).replace(/\s+/g, " ").trim();
}

const MEAL_WORDS: Array<{ word: string; type: MealType }> = [
  { word: "breakfast", type: "breakfast" },
  { word: "brunch", type: "breakfast" },
  { word: "lunch", type: "lunch" },
  { word: "dinner", type: "dinner" },
  { word: "supper", type: "dinner" },
  { word: "snack", type: "snacks" },
  { word: "dessert", type: "snacks" },
];

function normalise(text: string): string {
  return text
    .toLowerCase()
    .replace(/½/g, " 1/2 ")
    .replace(/¼/g, " 1/4 ")
    .replace(/¾/g, " 3/4 ")
    .replace(/&/g, " and ")
    .replace(/[^\w\s.,;/+]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function splitSegments(text: string): string[] {
  return text
    .split(/,| and | with | plus | \+ |;|\. /gi)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

interface ParsedQuantity {
  amount: number | null;
  massGrams: number | null;
  volumeUnit: ServingUnit | null;
  sizeFactor: number;
}

function parseQuantity(segment: string): ParsedQuantity {
  const tokens = segment.split(" ");
  let amount: number | null = null;
  let massGrams: number | null = null;
  let volumeUnit: ServingUnit | null = null;
  let sizeFactor = 1;

  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i];

    if (SIZE_WORDS[token] !== undefined) sizeFactor = SIZE_WORDS[token];

    let value: number | null = null;
    const fraction = token.match(/^(\d+)\/(\d+)$/);
    const attached = token.match(/^(\d+(?:\.\d+)?)([a-z]+)$/);

    if (fraction) {
      value = Number(fraction[1]) / Number(fraction[2]);
    } else if (/^\d+(\.\d+)?$/.test(token)) {
      value = Number(token);
    } else if (attached && (MASS_UNITS[attached[2]] || VOLUME_UNITS[attached[2]])) {
      value = Number(attached[1]);
      const unit = attached[2];
      if (MASS_UNITS[unit]) massGrams = value * MASS_UNITS[unit];
      else volumeUnit = VOLUME_UNITS[unit];
      if (amount === null) amount = value;
      continue;
    } else if (NUMBER_WORDS[token] !== undefined && amount === null) {
      value = NUMBER_WORDS[token];
    }

    if (value === null) continue;

    // "1 1/2 cups" - fold a following fraction into the whole number.
    const next = tokens[i + 1];
    const nextFraction = next?.match(/^(\d+)\/(\d+)$/);
    if (nextFraction && Number.isInteger(value)) {
      value += Number(nextFraction[1]) / Number(nextFraction[2]);
      i += 1;
    }

    const unitToken = tokens[i + 1];
    if (unitToken && MASS_UNITS[unitToken] !== undefined) {
      massGrams = value * MASS_UNITS[unitToken];
    } else if (unitToken && VOLUME_UNITS[unitToken] !== undefined) {
      volumeUnit = VOLUME_UNITS[unitToken];
    }
    if (amount === null) amount = value;
  }

  return { amount, massGrams, volumeUnit, sizeFactor };
}

const FRACTIONS: Array<[number, string]> = [
  [0.25, "1/4"],
  [0.33, "1/3"],
  [0.5, "1/2"],
  [0.67, "2/3"],
  [0.75, "3/4"],
];

function formatAmount(value: number): string {
  const whole = Math.floor(value);
  const rest = value - whole;
  const match = FRACTIONS.find(([fraction]) => Math.abs(rest - fraction) < 0.06);
  if (match) return whole > 0 ? `${whole} ${match[1]}` : match[1];
  if (Math.abs(value - Math.round(value)) < 0.06) return `${Math.round(value)}`;
  return value.toFixed(1);
}

/** Abbreviated units stay as-is; everything else pluralises above one. */
function pluralise(noun: string, amount: number): string {
  if (noun === "tbsp" || noun === "tsp") return noun;
  return amount > 1.05 ? `${noun}s` : noun;
}

function describeServing(food: FoodDefinition, factor: number): string {
  const amount = food.servingAmount * factor;
  switch (food.servingUnit) {
    case "g":
      return `${Math.round(amount)} g`;
    case "ml":
      return `${Math.round(amount)} ml`;
    case "piece":
      return `${formatAmount(amount)} ${pluralise(food.unitNoun ?? "serving", amount)}`;
    default:
      return `${formatAmount(amount)} ${pluralise(food.servingUnit, amount)}`;
  }
}

function round(value: number, digits = 1): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

interface ParsedItem {
  item: FoodItem;
  assumed: boolean;
  unknown: boolean;
  assumption?: string;
}

function buildItem(food: FoodDefinition, factor: number): FoodItem {
  const n = food.nutrition;
  return {
    id: createId("food"),
    name: food.name,
    quantity: describeServing(food, factor),
    calories: Math.round(n.calories * factor),
    protein: round(n.protein * factor),
    carbs: round(n.carbs * factor),
    fat: round(n.fat * factor),
    fiber: round(n.fiber * factor),
  };
}

function unknownItem(segment: string, quantity: ParsedQuantity): ParsedItem | null {
  const words = segment
    .split(" ")
    .filter((word) => word.length > 2 && !STOP_WORDS.has(word) && !/^\d/.test(word));
  if (words.length === 0) return null;

  const name = words.slice(0, 3).join(" ");
  const factor = quantity.amount && quantity.amount <= 6 ? quantity.amount : 1;
  return {
    unknown: true,
    assumed: true,
    assumption: `"${name}" isn't in our food list yet - we estimated it as an average mixed dish. Edit it if that looks off.`,
    item: {
      id: createId("food"),
      name: name.replace(/\b\w/g, (c) => c.toUpperCase()),
      quantity: quantity.amount ? `${formatAmount(quantity.amount)} serving` : "1 serving",
      calories: Math.round(240 * factor),
      protein: round(12 * factor),
      carbs: round(26 * factor),
      fat: round(9 * factor),
      fiber: round(2 * factor),
    },
  };
}

function itemForFood(food: FoodDefinition, quantity: ParsedQuantity): ParsedItem {
  let factor = quantity.sizeFactor;
  const assumed = quantity.amount === null && quantity.sizeFactor === 1;
  let assumption: string | undefined;

  if (quantity.massGrams !== null && food.gramsPerServing) {
    factor = quantity.massGrams / food.gramsPerServing;
  } else if (quantity.volumeUnit && quantity.volumeUnit === food.servingUnit && quantity.amount) {
    factor = (quantity.amount / food.servingAmount) * quantity.sizeFactor;
  } else if (quantity.volumeUnit === "ml" && food.servingUnit === "ml" && quantity.amount) {
    factor = (quantity.amount / food.servingAmount) * quantity.sizeFactor;
  } else if (quantity.amount !== null) {
    // A bare count: "2 eggs", "3 slices of toast".
    factor = quantity.amount * quantity.sizeFactor;
    if (food.servingUnit !== "piece" && food.servingUnit !== "slice") {
      factor = (quantity.amount / Math.max(food.servingAmount, 1)) * quantity.sizeFactor;
      if (food.servingUnit === "g" || food.servingUnit === "ml") {
        // "2 rice" makes no sense as grams - read it as 2 servings.
        factor = quantity.amount * quantity.sizeFactor;
      }
    }
  }

  if (!Number.isFinite(factor) || factor <= 0) factor = 1;
  factor = Math.min(factor, 25);

  if (assumed) {
    assumption = `Assumed ${describeServing(food, factor).toLowerCase()} of ${food.name.toLowerCase()}.`;
  }

  return { item: buildItem(food, factor), assumed, unknown: false, assumption };
}

/**
 * A segment can still hold several foods ("2 eggs 2 slices of toast"), so we
 * pull them out one at a time, longest keyword first, reading each quantity
 * from the words just before the food it belongs to.
 */
function parseSegment(segment: string): ParsedItem[] {
  const items: ParsedItem[] = [];
  let rest = segment;

  for (let guard = 0; guard < 8; guard += 1) {
    if (!rest.trim()) break;
    const match = findFood(rest);
    if (!match) break;

    const before = rest.slice(0, match.index);
    const after = rest.slice(match.index + match.keyword.length);
    let quantity = parseQuantity(`${before} ${match.keyword}`);
    if (quantity.amount === null && quantity.massGrams === null) {
      // "chicken 150g" - the amount can also trail the food name.
      const trailing = after.trim().split(" ").slice(0, 2).join(" ");
      const trailingQuantity = parseQuantity(trailing);
      if (trailingQuantity.amount !== null || trailingQuantity.massGrams !== null) {
        quantity = trailingQuantity;
      }
    }

    items.push(itemForFood(match.food, quantity));
    rest = after;
  }

  if (items.length === 0) {
    const fallback = unknownItem(segment, parseQuantity(segment));
    if (fallback) items.push(fallback);
  }

  return items;
}

function detectMealType(text: string, fallback: MealType): MealType {
  for (const { word, type } of MEAL_WORDS) {
    if (text.includes(word)) return type;
  }
  return fallback;
}

function titleCase(text: string): string {
  return text.replace(/\b\w/g, (c) => c.toUpperCase());
}

function buildMealName(text: string, items: FoodItem[], mealType: MealType): string {
  const dish = findDishPhrase(text);
  if (dish) {
    const qualifier = ["chicken", "beef", "steak", "salmon", "tofu", "shrimp", "turkey", "veggie"]
      .find((word) => text.includes(word) && !dish.includes(word));
    return titleCase(qualifier ? `${qualifier} ${dish}` : dish);
  }
  const named = [...items].sort((a, b) => b.calories - a.calories).slice(0, 2);
  if (named.length === 0) return titleCase(mealType);
  if (named.length === 1) return named[0].name;
  return `${named[0].name} & ${named[1].name.toLowerCase()}`;
}

function pickConfidence(parsed: ParsedItem[]): Confidence {
  // Unrecognised food is the only thing we call low confidence; a missing
  // quantity just means we assumed a standard serving.
  if (parsed.some((p) => p.unknown)) return "low";
  const assumed = parsed.filter((p) => p.assumed).length;
  return assumed === 0 ? "high" : "medium";
}

/** Deterministic core of the mock, exported so it can be unit tested. */
export function analyzeMealLocally(request: AnalyzeMealRequest): NutritionAnalysis {
  const raw = request.description.trim();
  if (raw.length < 2) {
    throw new NutritionAnalysisError("empty_input", "Tell us what you ate and we'll estimate it.", false);
  }

  const text = normalise(raw);
  // Naming still uses the full text; matching uses the stripped version.
  const segments = splitSegments(stripContainers(text));
  const parsed = segments.flatMap((segment) => parseSegment(segment));

  const recognised = parsed.filter((p) => !p.unknown);
  if (parsed.length === 0 || (recognised.length === 0 && text.split(" ").length < 3)) {
    throw new NutritionAnalysisError(
      "no_food_detected",
      "We couldn't find any food in that. Try something like \"2 eggs and a slice of toast\".",
    );
  }

  const items = parsed.map((p) => p.item);
  const loggedAt = request.loggedAt ? new Date(request.loggedAt) : new Date();
  const fallbackType = request.mealTypeHint ?? mealTypeForHour(loggedAt.getHours());
  const mealType = detectMealType(text, fallbackType);
  const totals = sumItems(items);

  const assumptions = parsed
    .map((p) => p.assumption)
    .filter((value): value is string => Boolean(value))
    .slice(0, 4);

  return {
    id: createId("analysis"),
    mealName: buildMealName(text, items, mealType),
    mealType,
    items,
    totals: {
      calories: Math.round(totals.calories),
      protein: round(totals.protein),
      carbs: round(totals.carbs),
      fat: round(totals.fat),
      fiber: round(totals.fiber),
    },
    confidence: pickConfidence(parsed),
    assumptions,
    sourceText: raw,
  };
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface MockServiceOptions {
  /** Chance of a simulated transient outage, so retry paths stay exercised. */
  failureRate?: number;
  minLatencyMs?: number;
  maxLatencyMs?: number;
}

export function createMockNutritionService(options: MockServiceOptions = {}): NutritionService {
  const { failureRate = 0.06, minLatencyMs = 900, maxLatencyMs = 1900 } = options;

  return {
    async analyzeMeal(request) {
      await delay(minLatencyMs + Math.random() * (maxLatencyMs - minLatencyMs));

      if (Math.random() < failureRate) {
        throw new NutritionAnalysisError(
          "service_unavailable",
          "The nutrition service didn't respond. Your text is still here - try again.",
        );
      }

      return { analysis: analyzeMealLocally(request) };
    },
  };
}

/**
 * Drop-in replacement for the mock once a backend exists. The route keeps the
 * model provider's API key server-side; the browser only ever sees this URL.
 */
export function createHttpNutritionService(endpoint = "/api/nutrition/analyze"): NutritionService {
  return {
    async analyzeMeal(request) {
      let response: Response;
      try {
        response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(request),
        });
      } catch {
        throw new NutritionAnalysisError("service_unavailable", "Couldn't reach the nutrition service.");
      }

      if (!response.ok) {
        throw new NutritionAnalysisError(
          "service_unavailable",
          "The nutrition service returned an error. Try again in a moment.",
        );
      }

      const payload = (await response.json()) as Partial<AnalyzeMealResponse>;
      const analysis = payload?.analysis;
      if (!analysis || !Array.isArray(analysis.items) || !analysis.totals) {
        throw new NutritionAnalysisError(
          "malformed_response",
          "We got an unexpected answer from the nutrition service.",
        );
      }
      return { analysis };
    },
  };
}

const endpoint = process.env.NEXT_PUBLIC_NUTRITION_API_URL;

export const nutritionService: NutritionService = endpoint
  ? createHttpNutritionService(endpoint)
  : createMockNutritionService();
