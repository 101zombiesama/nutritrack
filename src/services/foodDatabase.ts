/**
 * A small, hand-curated food table used by the mock nutrition analyser.
 * Values are per the serving described by `servingAmount` / `servingUnit`
 * and are deliberately approximate - the UI always presents them as estimates.
 *
 * When a real backend implements POST /api/nutrition/analyze this file is the
 * only piece that disappears; nothing in the UI depends on it.
 */

export type ServingUnit = "g" | "ml" | "piece" | "cup" | "tbsp" | "tsp" | "slice" | "scoop";

export interface FoodNutrition {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

export interface FoodDefinition {
  id: string;
  name: string;
  /** Lowercase phrases matched against the user's text, longest match wins. */
  keywords: string[];
  servingAmount: number;
  servingUnit: ServingUnit;
  /** Noun used when the serving is counted, e.g. "egg" -> "2 eggs". */
  unitNoun?: string;
  /** Enables "200g of X" style scaling for non-gram servings. */
  gramsPerServing?: number;
  nutrition: FoodNutrition;
}

const g = (
  id: string,
  name: string,
  keywords: string[],
  grams: number,
  nutrition: FoodNutrition,
): FoodDefinition => ({
  id,
  name,
  keywords,
  servingAmount: grams,
  servingUnit: "g",
  gramsPerServing: grams,
  nutrition,
});

const piece = (
  id: string,
  name: string,
  keywords: string[],
  unitNoun: string,
  gramsPerServing: number,
  nutrition: FoodNutrition,
): FoodDefinition => ({
  id,
  name,
  keywords,
  servingAmount: 1,
  servingUnit: "piece",
  unitNoun,
  gramsPerServing,
  nutrition,
});

export const FOOD_DATABASE: FoodDefinition[] = [
  /* --- eggs & breakfast --- */
  piece("scrambled_eggs", "Scrambled eggs", ["scrambled egg", "scrambled eggs"], "egg", 60, {
    calories: 96, protein: 6.6, carbs: 0.8, fat: 7.4, fiber: 0,
  }),
  piece("fried_egg", "Fried egg", ["fried egg", "fried eggs", "sunny side up"], "egg", 55, {
    calories: 90, protein: 6.3, carbs: 0.4, fat: 7, fiber: 0,
  }),
  piece("boiled_egg", "Boiled egg", ["boiled egg", "boiled eggs", "hard boiled egg"], "egg", 50, {
    calories: 78, protein: 6.3, carbs: 0.6, fat: 5.3, fiber: 0,
  }),
  piece("egg", "Egg", ["egg", "eggs"], "egg", 50, {
    calories: 72, protein: 6.3, carbs: 0.4, fat: 4.8, fiber: 0,
  }),
  piece("egg_white", "Egg whites", ["egg white", "egg whites"], "egg white", 33, {
    calories: 17, protein: 3.6, carbs: 0.2, fat: 0.1, fiber: 0,
  }),
  { id: "oatmeal", name: "Oatmeal", keywords: ["oatmeal", "porridge", "oats"], servingAmount: 1, servingUnit: "cup", gramsPerServing: 234, nutrition: { calories: 166, protein: 5.9, carbs: 28, fat: 3.6, fiber: 4 } },
  { id: "granola", name: "Granola", keywords: ["granola", "muesli"], servingAmount: 60, servingUnit: "g", gramsPerServing: 60, nutrition: { calories: 270, protein: 6, carbs: 37, fat: 11, fiber: 4.5 } },
  { id: "pancake", name: "Pancakes", keywords: ["pancake", "pancakes"], servingAmount: 1, servingUnit: "piece", unitNoun: "pancake", gramsPerServing: 77, nutrition: { calories: 175, protein: 4.9, carbs: 22, fat: 7.4, fiber: 0.8 } },
  { id: "cereal", name: "Breakfast cereal", keywords: ["cereal", "corn flakes", "cheerios"], servingAmount: 1, servingUnit: "cup", gramsPerServing: 40, nutrition: { calories: 150, protein: 3.5, carbs: 33, fat: 1.2, fiber: 3 } },

  /* --- breads & grains --- */
  { id: "sourdough_toast", name: "Sourdough toast", keywords: ["sourdough toast", "sourdough", "piece of sourdough"], servingAmount: 1, servingUnit: "slice", gramsPerServing: 52, nutrition: { calories: 138, protein: 5.4, carbs: 26, fat: 1.2, fiber: 1.3 } },
  { id: "toast", name: "Toast", keywords: ["toast", "bread", "slice of bread"], servingAmount: 1, servingUnit: "slice", gramsPerServing: 40, nutrition: { calories: 92, protein: 3.4, carbs: 17, fat: 1.2, fiber: 1.4 } },
  { id: "bagel", name: "Bagel", keywords: ["bagel"], servingAmount: 1, servingUnit: "piece", unitNoun: "bagel", gramsPerServing: 98, nutrition: { calories: 270, protein: 11, carbs: 53, fat: 1.7, fiber: 2.3 } },
  { id: "white_rice", name: "White rice", keywords: ["white rice", "rice", "jasmine rice", "basmati"], servingAmount: 1, servingUnit: "cup", gramsPerServing: 158, nutrition: { calories: 205, protein: 4.3, carbs: 45, fat: 0.4, fiber: 0.6 } },
  { id: "brown_rice", name: "Brown rice", keywords: ["brown rice"], servingAmount: 1, servingUnit: "cup", gramsPerServing: 195, nutrition: { calories: 218, protein: 4.5, carbs: 46, fat: 1.6, fiber: 3.5 } },
  { id: "pasta", name: "Pasta", keywords: ["pasta", "spaghetti", "penne", "noodles", "fusilli"], servingAmount: 1, servingUnit: "cup", gramsPerServing: 140, nutrition: { calories: 221, protein: 8.1, carbs: 43, fat: 1.3, fiber: 2.5 } },
  { id: "quinoa", name: "Quinoa", keywords: ["quinoa"], servingAmount: 1, servingUnit: "cup", gramsPerServing: 185, nutrition: { calories: 222, protein: 8.1, carbs: 39, fat: 3.6, fiber: 5.2 } },
  { id: "tortilla", name: "Tortilla", keywords: ["tortilla", "wrap"], servingAmount: 1, servingUnit: "piece", unitNoun: "tortilla", gramsPerServing: 49, nutrition: { calories: 146, protein: 3.9, carbs: 25, fat: 3.5, fiber: 1.5 } },
  { id: "potato", name: "Potato", keywords: ["potato", "baked potato", "potatoes"], servingAmount: 1, servingUnit: "piece", unitNoun: "potato", gramsPerServing: 173, nutrition: { calories: 161, protein: 4.3, carbs: 37, fat: 0.2, fiber: 3.8 } },
  { id: "sweet_potato", name: "Sweet potato", keywords: ["sweet potato"], servingAmount: 1, servingUnit: "piece", unitNoun: "sweet potato", gramsPerServing: 151, nutrition: { calories: 130, protein: 2.4, carbs: 30, fat: 0.2, fiber: 4.6 } },
  { id: "fries", name: "French fries", keywords: ["french fries", "fries", "chips"], servingAmount: 120, servingUnit: "g", gramsPerServing: 120, nutrition: { calories: 365, protein: 4.2, carbs: 48, fat: 17, fiber: 4.4 } },

  /* --- proteins --- */
  g("chicken_breast", "Chicken breast", ["chicken breast", "grilled chicken", "chicken"], 150, {
    calories: 248, protein: 46.5, carbs: 0, fat: 5.4, fiber: 0,
  }),
  g("chicken_thigh", "Chicken thigh", ["chicken thigh", "chicken thighs"], 150, {
    calories: 314, protein: 39, carbs: 0, fat: 16.4, fiber: 0,
  }),
  g("salmon", "Salmon", ["salmon"], 150, { calories: 312, protein: 34, carbs: 0, fat: 19, fiber: 0 }),
  g("tuna", "Tuna", ["tuna"], 120, { calories: 158, protein: 34, carbs: 0, fat: 1.6, fiber: 0 }),
  g("shrimp", "Shrimp", ["shrimp", "prawns"], 120, { calories: 119, protein: 27, carbs: 0.8, fat: 0.5, fiber: 0 }),
  g("beef_steak", "Steak", ["steak", "sirloin", "ribeye", "beef"], 170, { calories: 391, protein: 45, carbs: 0, fat: 23, fiber: 0 }),
  g("ground_beef", "Ground beef", ["ground beef", "mince", "minced beef"], 120, { calories: 290, protein: 26, carbs: 0, fat: 20, fiber: 0 }),
  g("pork", "Pork", ["pork", "pork chop"], 150, { calories: 350, protein: 40, carbs: 0, fat: 20, fiber: 0 }),
  g("bacon", "Bacon", ["bacon"], 30, { calories: 161, protein: 11, carbs: 0.4, fat: 13, fiber: 0 }),
  g("turkey", "Turkey", ["turkey"], 120, { calories: 160, protein: 34, carbs: 0, fat: 2.4, fiber: 0 }),
  g("tofu", "Tofu", ["tofu"], 150, { calories: 132, protein: 14, carbs: 3.3, fat: 8, fiber: 1.2 }),
  g("tempeh", "Tempeh", ["tempeh"], 100, { calories: 192, protein: 20, carbs: 7.6, fat: 11, fiber: 0 }),
  { id: "black_beans", name: "Black beans", keywords: ["black beans", "black bean"], servingAmount: 0.5, servingUnit: "cup", gramsPerServing: 86, nutrition: { calories: 114, protein: 7.6, carbs: 20, fat: 0.5, fiber: 7.5 } },
  { id: "chickpeas", name: "Chickpeas", keywords: ["chickpeas", "garbanzo"], servingAmount: 0.5, servingUnit: "cup", gramsPerServing: 82, nutrition: { calories: 134, protein: 7.3, carbs: 22, fat: 2.1, fiber: 6.2 } },
  { id: "lentils", name: "Lentils", keywords: ["lentils", "dal", "daal"], servingAmount: 1, servingUnit: "cup", gramsPerServing: 198, nutrition: { calories: 230, protein: 18, carbs: 40, fat: 0.8, fiber: 15.6 } },
  { id: "protein_shake", name: "Protein shake", keywords: ["protein shake", "whey shake", "protein powder"], servingAmount: 1, servingUnit: "scoop", gramsPerServing: 32, nutrition: { calories: 130, protein: 25, carbs: 4, fat: 1.5, fiber: 1 } },
  { id: "protein_bar", name: "Protein bar", keywords: ["protein bar"], servingAmount: 1, servingUnit: "piece", unitNoun: "bar", gramsPerServing: 60, nutrition: { calories: 220, protein: 20, carbs: 22, fat: 7, fiber: 5 } },

  /* --- dairy --- */
  g("greek_yogurt", "Greek yogurt", ["greek yogurt", "greek yoghurt", "yogurt", "yoghurt"], 170, {
    calories: 100, protein: 17, carbs: 6, fat: 0.7, fiber: 0,
  }),
  { id: "milk", name: "Milk", keywords: ["milk", "whole milk", "semi skimmed"], servingAmount: 250, servingUnit: "ml", gramsPerServing: 250, nutrition: { calories: 149, protein: 8, carbs: 12, fat: 8, fiber: 0 } },
  g("cheddar", "Cheddar cheese", ["cheddar", "cheese"], 30, { calories: 121, protein: 7, carbs: 0.4, fat: 10, fiber: 0 }),
  { id: "cottage_cheese", name: "Cottage cheese", keywords: ["cottage cheese"], servingAmount: 1, servingUnit: "cup", gramsPerServing: 226, nutrition: { calories: 206, protein: 28, carbs: 6, fat: 9, fiber: 0 } },
  { id: "butter", name: "Butter", keywords: ["butter"], servingAmount: 1, servingUnit: "tbsp", gramsPerServing: 14, nutrition: { calories: 102, protein: 0.1, carbs: 0, fat: 11.5, fiber: 0 } },

  /* --- fruit & veg --- */
  piece("banana", "Banana", ["banana"], "banana", 118, { calories: 105, protein: 1.3, carbs: 27, fat: 0.4, fiber: 3.1 }),
  piece("apple", "Apple", ["apple"], "apple", 182, { calories: 95, protein: 0.5, carbs: 25, fat: 0.3, fiber: 4.4 }),
  piece("orange", "Orange", ["orange"], "orange", 131, { calories: 62, protein: 1.2, carbs: 15, fat: 0.2, fiber: 3.1 }),
  { id: "berries", name: "Berries", keywords: ["berries", "blueberries", "strawberries", "raspberries"], servingAmount: 1, servingUnit: "cup", gramsPerServing: 148, nutrition: { calories: 84, protein: 1.1, carbs: 21, fat: 0.5, fiber: 3.6 } },
  { id: "avocado", name: "Avocado", keywords: ["avocado", "guacamole"], servingAmount: 0.5, servingUnit: "piece", unitNoun: "avocado", gramsPerServing: 68, nutrition: { calories: 114, protein: 1.3, carbs: 6, fat: 10.5, fiber: 4.6 } },
  { id: "salad", name: "Mixed salad", keywords: ["mixed salad", "green salad", "side salad", "salad greens", "lettuce", "spinach"], servingAmount: 2, servingUnit: "cup", gramsPerServing: 120, nutrition: { calories: 26, protein: 2.2, carbs: 4, fat: 0.3, fiber: 2.2 } },
  { id: "broccoli", name: "Broccoli", keywords: ["broccoli"], servingAmount: 1, servingUnit: "cup", gramsPerServing: 156, nutrition: { calories: 55, protein: 3.7, carbs: 11, fat: 0.6, fiber: 5.1 } },
  { id: "mixed_veg", name: "Mixed vegetables", keywords: ["vegetables", "veggies", "veg", "roasted vegetables"], servingAmount: 1, servingUnit: "cup", gramsPerServing: 150, nutrition: { calories: 72, protein: 3.2, carbs: 14, fat: 0.4, fiber: 4.4 } },
  { id: "tomato", name: "Tomato", keywords: ["tomato", "tomatoes"], servingAmount: 1, servingUnit: "piece", unitNoun: "tomato", gramsPerServing: 123, nutrition: { calories: 22, protein: 1.1, carbs: 4.8, fat: 0.2, fiber: 1.5 } },

  /* --- fats, sauces & extras --- */
  g("almonds", "Almonds", ["almonds", "almond"], 28, { calories: 164, protein: 6, carbs: 6.1, fat: 14, fiber: 3.5 }),
  g("peanut_butter", "Peanut butter", ["peanut butter"], 32, { calories: 188, protein: 8, carbs: 6.5, fat: 16, fiber: 1.8 }),
  g("walnuts", "Walnuts", ["walnuts", "nuts", "cashews"], 28, { calories: 185, protein: 4.3, carbs: 3.9, fat: 18.5, fiber: 1.9 }),
  { id: "olive_oil", name: "Olive oil", keywords: ["olive oil", "oil"], servingAmount: 1, servingUnit: "tbsp", gramsPerServing: 14, nutrition: { calories: 119, protein: 0, carbs: 0, fat: 13.5, fiber: 0 } },
  { id: "salsa", name: "Salsa", keywords: ["salsa", "pico de gallo"], servingAmount: 2, servingUnit: "tbsp", gramsPerServing: 36, nutrition: { calories: 10, protein: 0.5, carbs: 2.3, fat: 0.1, fiber: 0.6 } },
  { id: "mayo", name: "Mayonnaise", keywords: ["mayo", "mayonnaise"], servingAmount: 1, servingUnit: "tbsp", gramsPerServing: 14, nutrition: { calories: 94, protein: 0.1, carbs: 0.1, fat: 10, fiber: 0 } },
  { id: "hummus", name: "Hummus", keywords: ["hummus"], servingAmount: 2, servingUnit: "tbsp", gramsPerServing: 30, nutrition: { calories: 78, protein: 2.1, carbs: 6, fat: 5.2, fiber: 1.6 } },
  { id: "honey", name: "Honey", keywords: ["honey"], servingAmount: 1, servingUnit: "tbsp", gramsPerServing: 21, nutrition: { calories: 64, protein: 0.1, carbs: 17, fat: 0, fiber: 0 } },

  /* --- drinks --- */
  { id: "latte", name: "Latte", keywords: ["latte", "flat white", "cafe au lait"], servingAmount: 1, servingUnit: "piece", unitNoun: "latte", gramsPerServing: 350, nutrition: { calories: 182, protein: 10, carbs: 17, fat: 8, fiber: 0 } },
  { id: "cappuccino", name: "Cappuccino", keywords: ["cappuccino"], servingAmount: 1, servingUnit: "piece", unitNoun: "cappuccino", gramsPerServing: 240, nutrition: { calories: 120, protein: 7.5, carbs: 10, fat: 5.5, fiber: 0 } },
  { id: "coffee", name: "Black coffee", keywords: ["black coffee", "americano", "espresso", "coffee"], servingAmount: 1, servingUnit: "cup", gramsPerServing: 240, nutrition: { calories: 5, protein: 0.3, carbs: 0, fat: 0, fiber: 0 } },
  { id: "tea", name: "Tea", keywords: ["tea", "green tea"], servingAmount: 1, servingUnit: "cup", gramsPerServing: 240, nutrition: { calories: 2, protein: 0, carbs: 0.5, fat: 0, fiber: 0 } },
  { id: "orange_juice", name: "Orange juice", keywords: ["orange juice", "juice"], servingAmount: 250, servingUnit: "ml", gramsPerServing: 250, nutrition: { calories: 112, protein: 1.7, carbs: 26, fat: 0.5, fiber: 0.5 } },
  { id: "smoothie", name: "Fruit smoothie", keywords: ["smoothie"], servingAmount: 350, servingUnit: "ml", gramsPerServing: 350, nutrition: { calories: 240, protein: 6, carbs: 47, fat: 3.5, fiber: 5 } },
  { id: "beer", name: "Beer", keywords: ["beer", "lager", "pint"], servingAmount: 330, servingUnit: "ml", gramsPerServing: 330, nutrition: { calories: 142, protein: 1.5, carbs: 12, fat: 0, fiber: 0 } },
  { id: "wine", name: "Wine", keywords: ["wine", "glass of wine"], servingAmount: 150, servingUnit: "ml", gramsPerServing: 150, nutrition: { calories: 125, protein: 0.1, carbs: 4, fat: 0, fiber: 0 } },

  /* --- composed dishes --- */
  { id: "burrito", name: "Burrito", keywords: ["burrito"], servingAmount: 1, servingUnit: "piece", unitNoun: "burrito", gramsPerServing: 380, nutrition: { calories: 720, protein: 32, carbs: 90, fat: 25, fiber: 9 } },
  { id: "pizza_slice", name: "Pizza", keywords: ["pizza", "slice of pizza"], servingAmount: 1, servingUnit: "slice", gramsPerServing: 107, nutrition: { calories: 285, protein: 12, carbs: 36, fat: 10, fiber: 2.5 } },
  { id: "burger", name: "Cheeseburger", keywords: ["cheeseburger", "burger", "hamburger"], servingAmount: 1, servingUnit: "piece", unitNoun: "burger", gramsPerServing: 219, nutrition: { calories: 563, protein: 28, carbs: 45, fat: 30, fiber: 3 } },
  { id: "sandwich", name: "Sandwich", keywords: ["sandwich", "sub", "panini"], servingAmount: 1, servingUnit: "piece", unitNoun: "sandwich", gramsPerServing: 250, nutrition: { calories: 430, protein: 22, carbs: 48, fat: 16, fiber: 4 } },
  { id: "sushi_roll", name: "Sushi roll", keywords: ["sushi roll", "sushi", "maki"], servingAmount: 1, servingUnit: "piece", unitNoun: "roll", gramsPerServing: 170, nutrition: { calories: 290, protein: 12, carbs: 48, fat: 5, fiber: 3 } },
  { id: "curry", name: "Curry", keywords: ["curry", "tikka masala", "korma"], servingAmount: 1, servingUnit: "cup", gramsPerServing: 250, nutrition: { calories: 400, protein: 24, carbs: 18, fat: 26, fiber: 3 } },
  { id: "pad_thai", name: "Pad thai", keywords: ["pad thai"], servingAmount: 1, servingUnit: "piece", unitNoun: "plate", gramsPerServing: 350, nutrition: { calories: 640, protein: 26, carbs: 82, fat: 22, fiber: 4 } },
  { id: "soup", name: "Soup", keywords: ["soup", "broth"], servingAmount: 1, servingUnit: "cup", gramsPerServing: 245, nutrition: { calories: 150, protein: 8, carbs: 18, fat: 5, fiber: 2.5 } },
  { id: "chocolate", name: "Chocolate", keywords: ["chocolate", "dark chocolate"], servingAmount: 30, servingUnit: "g", gramsPerServing: 30, nutrition: { calories: 160, protein: 2, carbs: 14, fat: 11, fiber: 2.5 } },
  { id: "cookie", name: "Cookie", keywords: ["cookie", "biscuit"], servingAmount: 1, servingUnit: "piece", unitNoun: "cookie", gramsPerServing: 40, nutrition: { calories: 190, protein: 2.2, carbs: 25, fat: 9, fiber: 1 } },
  { id: "ice_cream", name: "Ice cream", keywords: ["ice cream", "gelato"], servingAmount: 1, servingUnit: "cup", gramsPerServing: 132, nutrition: { calories: 273, protein: 4.6, carbs: 31, fat: 15, fiber: 0.9 } },
  { id: "crisps", name: "Potato chips", keywords: ["crisps", "potato chips"], servingAmount: 30, servingUnit: "g", gramsPerServing: 30, nutrition: { calories: 160, protein: 2, carbs: 15, fat: 10, fiber: 1.2 } },
];

/** Phrases that make a nicer meal title than a list of ingredients. */
export const DISH_PHRASES = [
  "burrito bowl",
  "poke bowl",
  "protein shake",
  "protein bar",
  "greek yogurt bowl",
  "chicken burrito bowl",
  "pad thai",
  "fried rice",
  "stir fry",
  "caesar salad",
  "chicken salad",
  "avocado toast",
  "overnight oats",
  "egg sandwich",
  "breakfast burrito",
  "acai bowl",
  "smoothie bowl",
  "rice bowl",
  "pasta bake",
  "curry",
];

const SORTED_FOODS = [...FOOD_DATABASE].sort((a, b) => {
  const aLongest = Math.max(...a.keywords.map((k) => k.length));
  const bLongest = Math.max(...b.keywords.map((k) => k.length));
  return bLongest - aLongest;
});

export interface FoodMatch {
  food: FoodDefinition;
  keyword: string;
  index: number;
}

/** Longest-keyword-first match so "brown rice" beats "rice". */
export function findFood(text: string): FoodMatch | null {
  let best: FoodMatch | null = null;
  for (const food of SORTED_FOODS) {
    for (const keyword of food.keywords) {
      const index = text.indexOf(keyword);
      if (index === -1) continue;
      if (!best || keyword.length > best.keyword.length) {
        best = { food, keyword, index };
      }
    }
  }
  return best;
}

export function findDishPhrase(text: string): string | null {
  let best: string | null = null;
  for (const phrase of DISH_PHRASES) {
    if (text.includes(phrase) && (!best || phrase.length > best.length)) best = phrase;
  }
  return best;
}
