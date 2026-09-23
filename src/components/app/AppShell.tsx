"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import styles from "./AppShell.module.css";
import { useApp } from "@/state/AppProvider";
import {
  ChartIcon,
  HomeIcon,
  LeafIcon,
  MoonIcon,
  PlusIcon,
  SparkIcon,
  SunIcon,
  UserIcon,
} from "@/components/ui/Icons";
import { PageSkeleton } from "./PageSkeleton";

const NAV_ITEMS = [
  { href: "/", label: "Today", Icon: HomeIcon },
  { href: "/log", label: "AI Log", Icon: SparkIcon },
  { href: "/trends", label: "Trends", Icon: ChartIcon },
  { href: "/profile", label: "Profile", Icon: UserIcon },
] as const;

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { data, setTheme, hydrated } = useApp();
  const isDark = data.preferences.theme === "dark";
  const isChat = pathname.startsWith("/log");

  const toggleTheme = () => setTheme(isDark ? "light" : "dark");

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <span className={styles.brandMark}>
            <LeafIcon size={19} />
          </span>
          <span>
            <span className={styles.brandName}>NutriTrack</span>
            <span className={styles.brandTag} style={{ display: "block" }}>
              Nutrition, simply
            </span>
          </span>
        </div>

        <nav className={styles.nav} aria-label="Main">
          {NAV_ITEMS.map(({ href, label, Icon }) => {
            const active = isActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                className={`${styles.navLink} ${active ? styles.navActive : ""}`}
                aria-current={active ? "page" : undefined}
              >
                <Icon size={18} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className={styles.sidebarFooter}>
          <Link href="/log" className={styles.logCta}>
            <PlusIcon size={18} />
            Log food
          </Link>
          <div className={styles.themeToggle}>
            <span>{isDark ? "Dark" : "Light"} mode</span>
            <button
              type="button"
              className={styles.themeButton}
              onClick={toggleTheme}
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDark ? <MoonIcon size={16} /> : <SunIcon size={16} />}
            </button>
          </div>
        </div>
      </aside>

      <div className={styles.main}>
        <header className={styles.mobileHeader}>
          <div className={styles.brand} style={{ padding: 0 }}>
            <span className={styles.brandMark}>
              <LeafIcon size={18} />
            </span>
            <span className={styles.brandName}>NutriTrack</span>
          </div>
          <button
            type="button"
            className={styles.themeButton}
            onClick={toggleTheme}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDark ? <MoonIcon size={18} /> : <SunIcon size={18} />}
          </button>
        </header>

        <main className={`${styles.content} ${isChat ? styles.contentFlush : ""}`}>
          {hydrated ? children : <PageSkeleton />}
        </main>

        <nav className={styles.bottomNav} aria-label="Main">
          {NAV_ITEMS.map(({ href, label, Icon }) => {
            const active = isActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                className={`${styles.bottomLink} ${active ? styles.bottomActive : ""}`}
                aria-current={active ? "page" : undefined}
              >
                <Icon size={20} />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
