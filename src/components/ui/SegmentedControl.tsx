"use client";

import styles from "./SegmentedControl.module.css";

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
  /** Optional colour dot, so identity is not carried by colour alone. */
  color?: string;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
  block?: boolean;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  block = false,
}: SegmentedControlProps<T>) {
  return (
    <div className={`${styles.wrap} ${block ? styles.block : ""}`} role="tablist" aria-label={ariaLabel}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            className={`${styles.option} ${active ? styles.active : ""}`}
            onClick={() => onChange(option.value)}
          >
            {option.color ? (
              <span
                className={styles.swatch}
                style={{ ["--swatch-color" as string]: option.color }}
                aria-hidden="true"
              />
            ) : null}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
