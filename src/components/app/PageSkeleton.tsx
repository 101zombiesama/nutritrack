import { Skeleton } from "@/components/ui/Skeleton";
import styles from "./PageSkeleton.module.css";

export function PageSkeleton() {
  return (
    <div className={styles.wrap} aria-busy="true" aria-label="Loading">
      <Skeleton width={180} height={14} />
      <Skeleton width={260} height={28} />
      <Skeleton height={190} radius="20px" />
      <div className={styles.row}>
        <Skeleton height={120} radius="20px" />
        <Skeleton height={120} radius="20px" />
        <Skeleton height={120} radius="20px" />
      </div>
      <Skeleton height={230} radius="20px" />
    </div>
  );
}
