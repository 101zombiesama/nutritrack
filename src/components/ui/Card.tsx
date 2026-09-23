import type { ReactNode } from "react";
import styles from "./Card.module.css";

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: "default" | "large" | "none";
  as?: "div" | "section" | "article";
}

export function Card({ children, className = "", padding = "default", as = "div" }: CardProps) {
  const Tag = as;
  const paddingClass =
    padding === "large" ? styles.padded : padding === "none" ? styles.flush : "";
  return <Tag className={`${styles.card} ${paddingClass} ${className}`}>{children}</Tag>;
}

interface CardHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  id?: string;
}

export function CardHeader({ title, subtitle, action, id }: CardHeaderProps) {
  return (
    <div className={styles.header}>
      <div className={styles.titleGroup}>
        <h2 className={styles.title} id={id}>
          {title}
        </h2>
        {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}
