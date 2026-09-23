import styles from "./StatTile.module.css";

interface StatTileProps {
  label: string;
  value: string;
  unit?: string;
  sub?: string;
  color?: string;
}

export function StatTile({ label, value, unit, sub, color }: StatTileProps) {
  return (
    <div className={styles.tile}>
      <span className={styles.label}>
        {color ? <span className={styles.dot} style={{ ["--dot" as string]: color }} /> : null}
        {label}
      </span>
      <span className={`${styles.value} tabular`}>
        {value}
        {unit ? <span className={styles.unit}>{unit}</span> : null}
      </span>
      {sub ? <span className={styles.sub}>{sub}</span> : null}
    </div>
  );
}

export function StatGrid({ children }: { children: React.ReactNode }) {
  return <div className={styles.grid}>{children}</div>;
}
