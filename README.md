# NutriTrack

A nutrition tracking frontend built with Next.js (App Router), React and plain CSS
Modules. Everything runs in the browser: there is no backend, and all data lives in
`localStorage`, so the whole app can be used end to end as-is.

```bash
npm run dev     # http://localhost:3000
npm run build   # production build
npm run lint    # eslint
```

## The core loop

Describe a meal in your own words → the nutrition service estimates it → you confirm
or correct it → it is logged, and every calorie/macro figure in the app updates.

## Screens

| Route | What it does |
| --- | --- |
| `/` | Today: calorie ring (consumed / goal / remaining), protein-carbs-fat cards, today's meals grouped by slot, inline edit and delete |
| `/log` | AI food log: chat interface, suggested prompts, analysing state, confirmation card with **Add to today / Edit / Try again** |
| `/trends` | 7 / 30 / 90 day charts per nutrient with the goal drawn in, period averages, macro split, body weight vs goal |
| `/profile` | Personal details, nutrition goals (target vs daily maximum), suggested goals, weigh-ins, theme and preferences |

## How it is put together

```
src/
  services/nutritionService.ts   the AI seam - analyzeMeal()
  services/foodDatabase.ts       the mock's food table
  state/AppProvider.tsx          one reducer + context, persisted to localStorage
  lib/nutrition.ts               all derivations (totals, progress, averages)
  lib/seed.ts                    ~3 months of realistic sample data
  components/                    ui primitives, dashboard, chat, trends, profile
```

Totals are always derived from the food items of a meal - nothing stores a separate
calorie figure - so adding, editing or deleting a meal updates every view at once.

## Connecting a real backend

`src/services/nutritionService.ts` defines the whole contract:

```ts
interface NutritionService {
  analyzeMeal(request: AnalyzeMealRequest): Promise<AnalyzeMealResponse>;
}
```

Two implementations ship with it:

- `createMockNutritionService()` - parses the description locally, with realistic
  latency, a small simulated failure rate and typed `NutritionAnalysisError` codes.
- `createHttpNutritionService(endpoint)` - posts the same request to
  `POST /api/nutrition/analyze` and validates the response shape.

The exported `nutritionService` picks the HTTP one when
`NEXT_PUBLIC_NUTRITION_API_URL` is set, so swapping in a real endpoint needs no UI
changes. Any model provider credentials belong on that server route - nothing secret
is ever read in the browser.

## Notes

- Nutrition figures from the AI log are estimates and are labelled as such; every
  meal stays editable.
- Suggested goals come from a standard energy formula and are presented as a
  starting point, not medical or dietary advice.
- Data can be wiped and re-seeded from **Profile → Reset demo data**.
