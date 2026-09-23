import type { ReactNode } from "react";
import styles from "./Badge.module.css";

type Tone = "neutral" | "brand" | "warning" | "over" | "outline";

interface BadgeProps {
  children: ReactNode;
  tone?: Tone;
  withDot?: boolean;
  className?: string;
}

export function Badge({ children, tone = "neutral", withDot = false, className = "" }: BadgeProps) {
  const toneClass = tone === "neutral" ? "" : styles[tone];
  return (
    <span className={`${styles.badge} ${toneClass} ${className}`}>
      {withDot ? <span className={styles.dot} aria-hidden="true" /> : null}
      {children}
    </span>
  );
}
