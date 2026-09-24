"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import { createId } from "@/lib/id";
import { todayISO } from "@/lib/dates";
import { loadData, saveData, clearData, writeStoredTheme } from "@/lib/storage";
import { createSeedData } from "@/lib/seed";
import type {
  AppData,
  ChatMessage,
  Meal,
  NutritionAnalysis,
  NutritionGoals,
  Preferences,
  ThemePreference,
  UserProfile,
  WeightEntry,
} from "@/lib/types";

type Action =
  | { type: "hydrate"; data: AppData }
  | { type: "addMeal"; meal: Meal }
  | { type: "updateMeal"; meal: Meal }
  | { type: "deleteMeal"; id: string }
  | { type: "setGoals"; goals: NutritionGoals }
  | { type: "setProfile"; profile: UserProfile }
  | { type: "setPreferences"; preferences: Partial<Preferences> }
  | { type: "upsertWeight"; entry: WeightEntry }
  | { type: "deleteWeight"; id: string }
  | { type: "appendMessage"; message: ChatMessage }
  | { type: "updateMessage"; id: string; patch: Partial<ChatMessage> }
  | { type: "removeMessage"; id: string }
  | { type: "resetChat"; message: ChatMessage }
  | { type: "reset"; data: AppData };

interface State {
  data: AppData;
  /** False until the persisted data has been read from localStorage. */
  hydrated: boolean;
}

function dataReducer(state: AppData, action: Action): AppData {
  switch (action.type) {
    case "hydrate":
    case "reset":
      return action.data;
    case "addMeal":
      return { ...state, meals: [...state.meals, action.meal], demo: false };
    case "updateMeal":
      return {
        ...state,
        meals: state.meals.map((meal) => (meal.id === action.meal.id ? action.meal : meal)),
      };
    case "deleteMeal":
      return { ...state, meals: state.meals.filter((meal) => meal.id !== action.id) };
    case "setGoals":
      return { ...state, goals: action.goals };
    case "setProfile":
      return { ...state, profile: action.profile };
    case "setPreferences":
      return { ...state, preferences: { ...state.preferences, ...action.preferences } };
    case "upsertWeight": {
      const existing = state.weights.find((entry) => entry.date === action.entry.date);
      const weights = existing
        ? state.weights.map((entry) =>
            entry.date === action.entry.date ? { ...entry, weightKg: action.entry.weightKg } : entry,
          )
        : [...state.weights, action.entry];
      return {
        ...state,
        weights: weights.sort((a, b) => a.date.localeCompare(b.date)),
        demo: false,
      };
    }
    case "deleteWeight":
      return { ...state, weights: state.weights.filter((entry) => entry.id !== action.id) };
    case "appendMessage":
      return { ...state, chat: [...state.chat, action.message] };
    case "updateMessage":
      return {
        ...state,
        chat: state.chat.map((message) =>
          message.id === action.id ? { ...message, ...action.patch } : message,
        ),
      };
    case "removeMessage":
      return { ...state, chat: state.chat.filter((message) => message.id !== action.id) };
    case "resetChat":
      return { ...state, chat: [action.message] };
    default:
      return state;
  }
}

function reducer(state: State, action: Action): State {
  const data = dataReducer(state.data, action);
  const hydrated = action.type === "hydrate" ? true : state.hydrated;
  if (data === state.data && hydrated === state.hydrated) return state;
  return { data, hydrated };
}

export interface AppContextValue {
  data: AppData;
  hydrated: boolean;
  /** Logs an AI analysis as a meal and returns the stored meal. */
  logMealFromAnalysis: (analysis: NutritionAnalysis, date?: string) => Meal;
  addMeal: (meal: Meal) => void;
  updateMeal: (meal: Meal) => void;
  deleteMeal: (id: string) => void;
  setGoals: (goals: NutritionGoals) => void;
  setProfile: (profile: UserProfile) => void;
  setPreferences: (preferences: Partial<Preferences>) => void;
  setTheme: (theme: ThemePreference) => void;
  logWeight: (weightKg: number, date?: string) => void;
  deleteWeight: (id: string) => void;
  appendMessage: (message: ChatMessage) => void;
  updateMessage: (id: string, patch: Partial<ChatMessage>) => void;
  removeMessage: (id: string) => void;
  resetChat: () => void;
  resetDemoData: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

function applyTheme(theme: ThemePreference) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const prefersDark =
    typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
  const resolved = theme === "system" ? (prefersDark ? "dark" : "light") : theme;
  root.dataset.theme = resolved;
  root.style.colorScheme = resolved;
}

export function AppProvider({ children }: { children: ReactNode }) {
  // Seed data renders on the server too, so the first paint is never blank;
  // the real (persisted) data replaces it on mount.
  const [{ data: state, hydrated }, dispatch] = useReducer(reducer, null, () => ({
    data: createSeedData(),
    hydrated: false,
  }));

  useEffect(() => {
    dispatch({ type: "hydrate", data: loadData() });
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveData(state);
  }, [state, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    applyTheme(state.preferences.theme);
    writeStoredTheme(state.preferences.theme);
  }, [state.preferences.theme, hydrated]);

  useEffect(() => {
    if (state.preferences.theme !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = () => applyTheme("system");
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [state.preferences.theme]);

  const logMealFromAnalysis = useCallback((analysis: NutritionAnalysis, date?: string) => {
    const meal: Meal = {
      id: createId("meal"),
      date: date ?? todayISO(),
      mealType: analysis.mealType,
      name: analysis.mealName,
      items: analysis.items.map((item) => ({ ...item, id: item.id || createId("food") })),
      loggedAt: new Date().toISOString(),
      source: "ai",
      confidence: analysis.confidence,
    };
    dispatch({ type: "addMeal", meal });
    return meal;
  }, []);

  const value = useMemo<AppContextValue>(
    () => ({
      data: state,
      hydrated,
      logMealFromAnalysis,
      addMeal: (meal) => dispatch({ type: "addMeal", meal }),
      updateMeal: (meal) => dispatch({ type: "updateMeal", meal }),
      deleteMeal: (id) => dispatch({ type: "deleteMeal", id }),
      setGoals: (goals) => dispatch({ type: "setGoals", goals }),
      setProfile: (profile) => dispatch({ type: "setProfile", profile }),
      setPreferences: (preferences) => dispatch({ type: "setPreferences", preferences }),
      setTheme: (theme) => dispatch({ type: "setPreferences", preferences: { theme } }),
      logWeight: (weightKg, date) =>
        dispatch({
          type: "upsertWeight",
          entry: { id: createId("weight"), date: date ?? todayISO(), weightKg },
        }),
      deleteWeight: (id) => dispatch({ type: "deleteWeight", id }),
      appendMessage: (message) => dispatch({ type: "appendMessage", message }),
      updateMessage: (id, patch) => dispatch({ type: "updateMessage", id, patch }),
      removeMessage: (id) => dispatch({ type: "removeMessage", id }),
      resetChat: () =>
        dispatch({
          type: "resetChat",
          message: {
            id: createId("msg"),
            role: "assistant",
            kind: "text",
            createdAt: new Date().toISOString(),
            text: "Fresh start. What did you eat?",
          },
        }),
      resetDemoData: () => {
        clearData();
        const seeded = createSeedData();
        dispatch({ type: "reset", data: seeded });
        saveData(seeded);
      },
    }),
    [state, hydrated, logMealFromAnalysis],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used inside <AppProvider>");
  return context;
}
