import styles from "./ProgressBar.module.css";

interface ProgressBarProps {
  /** 0-100+; anything past 100 renders as a distinct overage slice. */
  percent: number;
  color?: string;
  thick?: boolean;
  label?: string;
  className?: string;
}

export function ProgressBar({ percent, color, thick, label, className = "" }: ProgressBarProps) {
  const safe = Number.isFinite(percent) ? Math.max(0, percent) : 0;
  const filled = Math.min(100, safe);
  const overflow = safe > 100 ? Math.min(100, ((safe - 100) / safe) * 100) : 0;

  return (
    <div
      className={`${styles.wrap} ${thick ? styles.thick : ""} ${className}`}
      role="progressbar"
      aria-valuenow={Math.round(safe)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div
        className={styles.fill}
        style={{ width: `${filled}%`, ["--bar-color" as string]: color }}
      />
      {overflow > 0 ? <div className={styles.overflow} style={{ width: `${overflow}%` }} /> : null}
    </div>
  );
}
