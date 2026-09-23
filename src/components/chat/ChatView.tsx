"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnalysisCard } from "./AnalysisCard";
import { MealEditor, type MealDraft } from "@/components/meals/MealEditor";
import { Button } from "@/components/ui/Button";
import { RefreshIcon, SendIcon, SparkIcon } from "@/components/ui/Icons";
import { useToast } from "@/components/ui/Toast";
import { createId } from "@/lib/id";
import { sumItems } from "@/lib/nutrition";
import type { ChatMessage, NutritionAnalysis } from "@/lib/types";
import {
  NutritionAnalysisError,
  nutritionService,
} from "@/services/nutritionService";
import { useApp } from "@/state/AppProvider";
import styles from "./ChatView.module.css";

const SUGGESTIONS = [
  "Log my breakfast: 2 eggs, toast and a latte",
  "I had chicken and rice for lunch",
  "Add a protein shake",
  "200g greek yogurt, a banana and 20g almonds",
];

export function ChatView() {
  const { data, appendMessage, updateMessage, resetChat, logMealFromAnalysis } = useApp();
  const { showToast } = useToast();
  const router = useRouter();

  const [input, setInput] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [editing, setEditing] = useState<{ messageId: string; draft: MealDraft; analysis: NutritionAnalysis } | null>(
    null,
  );

  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messages = data.chat;
  const showSuggestions = messages.filter((message) => message.role === "user").length === 0;

  useEffect(() => {
    const node = scrollRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [messages.length, analyzing]);

  const runAnalysis = useCallback(
    async (description: string) => {
      setAnalyzing(true);
      try {
        const { analysis } = await nutritionService.analyzeMeal({
          description,
          history: messages.filter((message) => message.role === "user").slice(-4).map((m) => m.text ?? ""),
        });
        appendMessage({
          id: createId("msg"),
          role: "assistant",
          kind: "analysis",
          createdAt: new Date().toISOString(),
          analysis,
          analysisState: "pending",
        });
      } catch (error) {
        const message =
          error instanceof NutritionAnalysisError
            ? error.message
            : "Something went wrong while estimating that meal.";
        appendMessage({
          id: createId("msg"),
          role: "assistant",
          kind: "error",
          createdAt: new Date().toISOString(),
          errorMessage: message,
          retryText: description,
        });
      } finally {
        setAnalyzing(false);
      }
    },
    [appendMessage, messages],
  );

  const submit = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || analyzing) return;
      appendMessage({
        id: createId("msg"),
        role: "user",
        kind: "text",
        createdAt: new Date().toISOString(),
        text: trimmed,
      });
      setInput("");
      if (textareaRef.current) textareaRef.current.style.height = "auto";
      void runAnalysis(trimmed);
    },
    [analyzing, appendMessage, runAnalysis],
  );

  const handleAdd = (message: ChatMessage) => {
    if (!message.analysis) return;
    const meal = logMealFromAnalysis(message.analysis);
    updateMessage(message.id, { analysisState: "saved", savedMealId: meal.id });
    showToast(`${meal.name} added to today`, {
      action: { label: "View", onClick: () => router.push("/") },
    });
  };

  const handleRetry = (message: ChatMessage) => {
    const source = message.analysis?.sourceText ?? message.retryText;
    if (!source) return;
    if (message.kind === "analysis") updateMessage(message.id, { analysisState: "discarded" });
    void runAnalysis(source);
  };

  const handleSaveEdited = (draft: MealDraft) => {
    if (!editing) return;
    const totals = sumItems(draft.items);
    const analysis: NutritionAnalysis = {
      ...editing.analysis,
      mealName: draft.name,
      mealType: draft.mealType,
      items: draft.items,
      totals,
    };
    const meal = logMealFromAnalysis(analysis);
    updateMessage(editing.messageId, {
      analysis,
      analysisState: "saved",
      savedMealId: meal.id,
    });
    setEditing(null);
    showToast(`${meal.name} added to today`, {
      action: { label: "View", onClick: () => router.push("/") },
    });
  };

  return (
    <div className={styles.wrap}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>AI food log</h1>
          <p className={styles.subtitle}>
            Describe your meal in your own words. We&rsquo;ll estimate the nutrition, then you
            confirm or correct it before it&rsquo;s logged.
          </p>
        </div>
        {messages.length > 1 ? (
          <button type="button" className={styles.clearButton} onClick={resetChat}>
            Clear chat
          </button>
        ) : null}
      </header>

      <div className={`${styles.scroll} ${showSuggestions ? styles.scrollEmpty : ""}`} ref={scrollRef}>
        {messages.map((message) => {
          if (message.role === "user") {
            return (
              <div key={message.id} className={`${styles.row} ${styles.userRow}`}>
                <div className={`${styles.bubble} ${styles.userBubble}`}>{message.text}</div>
              </div>
            );
          }

          return (
            <div key={message.id} className={styles.row}>
              <span className={styles.avatar}>
                <SparkIcon size={15} />
              </span>
              {message.kind === "analysis" && message.analysis ? (
                <AnalysisCard
                  analysis={message.analysis}
                  state={message.analysisState}
                  onAdd={() => handleAdd(message)}
                  onEdit={() =>
                    setEditing({
                      messageId: message.id,
                      analysis: message.analysis!,
                      draft: {
                        name: message.analysis!.mealName,
                        mealType: message.analysis!.mealType,
                        items: message.analysis!.items,
                      },
                    })
                  }
                  onRetry={() => handleRetry(message)}
                />
              ) : message.kind === "error" ? (
                <div className={`${styles.bubble} ${styles.errorBubble}`}>
                  <span>{message.errorMessage}</span>
                  {message.retryText ? (
                    <Button size="sm" variant="secondary" onClick={() => handleRetry(message)}>
                      <RefreshIcon size={15} /> Try again
                    </Button>
                  ) : null}
                </div>
              ) : (
                <div className={`${styles.bubble} ${styles.assistantBubble}`}>{message.text}</div>
              )}
            </div>
          );
        })}

        {analyzing ? (
          <div className={styles.row}>
            <span className={styles.avatar}>
              <SparkIcon size={15} />
            </span>
            <div className={`${styles.bubble} ${styles.assistantBubble} ${styles.loadingBubble}`}>
              <span className={styles.dots} aria-hidden="true">
                <span className={styles.dot} />
                <span className={styles.dot} />
                <span className={styles.dot} />
              </span>
              <span role="status">Analyzing your meal…</span>
            </div>
          </div>
        ) : null}
      </div>

      {showSuggestions ? (
        <div className={styles.suggestions}>
          {SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              className={styles.suggestion}
              onClick={() => submit(suggestion)}
            >
              {suggestion}
            </button>
          ))}
        </div>
      ) : null}

      <div className={styles.composerWrap}>
        <form
          className={styles.composer}
          onSubmit={(event) => {
            event.preventDefault();
            submit(input);
          }}
        >
          <label htmlFor="meal-input" className="sr-only">
            Describe what you ate
          </label>
          <textarea
            id="meal-input"
            ref={textareaRef}
            className={styles.textarea}
            rows={1}
            value={input}
            placeholder="What did you eat?"
            onChange={(event) => {
              setInput(event.target.value);
              const node = event.target;
              node.style.height = "auto";
              node.style.height = `${Math.min(node.scrollHeight, 140)}px`;
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                submit(input);
              }
            }}
          />
          <button
            type="submit"
            className={styles.send}
            disabled={!input.trim() || analyzing}
            aria-label="Send meal description"
          >
            <SendIcon size={17} />
          </button>
        </form>
        <div className={styles.hint}>
          <span>Estimates only - always check the numbers before saving.</span>
          <span className={styles.keyHint}>Enter to send · Shift + Enter for a new line</span>
        </div>
      </div>

      <MealEditor
        open={editing !== null}
        title="Edit estimate"
        subtitle="Correct quantities or macros before this meal is logged."
        draft={editing?.draft ?? null}
        saveLabel="Add to today"
        onSave={handleSaveEdited}
        onClose={() => setEditing(null)}
      />
    </div>
  );
}
