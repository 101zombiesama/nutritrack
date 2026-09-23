/** Local-time date helpers. Every stored date is a local YYYY-MM-DD string. */

export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function fromISODate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function todayISO(): string {
  return toISODate(new Date());
}

export function addDays(iso: string, days: number): string {
  const date = fromISODate(iso);
  date.setDate(date.getDate() + days);
  return toISODate(date);
}

/** Inclusive list of the `count` days ending at `endISO`, oldest first. */
export function lastNDays(count: number, endISO: string = todayISO()): string[] {
  const days: string[] = [];
  for (let i = count - 1; i >= 0; i -= 1) days.push(addDays(endISO, -i));
  return days;
}

export function daysBetween(aISO: string, bISO: string): number {
  const ms = fromISODate(bISO).getTime() - fromISODate(aISO).getTime();
  return Math.round(ms / 86_400_000);
}

export function isToday(iso: string): boolean {
  return iso === todayISO();
}

const LONG_DATE = new Intl.DateTimeFormat(undefined, {
  weekday: "long",
  month: "long",
  day: "numeric",
});

const SHORT_DATE = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" });
const WEEKDAY = new Intl.DateTimeFormat(undefined, { weekday: "short" });
const TIME = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" });

export function formatLongDate(iso: string): string {
  return LONG_DATE.format(fromISODate(iso));
}

export function formatShortDate(iso: string): string {
  return SHORT_DATE.format(fromISODate(iso));
}

export function formatWeekday(iso: string): string {
  return WEEKDAY.format(fromISODate(iso));
}

export function formatTime(isoTimestamp: string): string {
  const date = new Date(isoTimestamp);
  if (Number.isNaN(date.getTime())) return "";
  return TIME.format(date);
}

export function relativeDayLabel(iso: string): string {
  const diff = daysBetween(iso, todayISO());
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return formatShortDate(iso);
}

export function greetingForHour(hour: number = new Date().getHours()): string {
  if (hour < 5) return "Still up";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

/** Best guess at which meal slot a log at this time belongs to. */
export function mealTypeForHour(hour: number = new Date().getHours()) {
  if (hour < 10) return "breakfast" as const;
  if (hour < 15) return "lunch" as const;
  if (hour < 21) return "dinner" as const;
  return "snacks" as const;
}
