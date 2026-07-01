export const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export const WEEK_START_HOUR = 6;
export const WEEK_END_HOUR = 22;
export const SLOT_MINUTES = 30;
export const MONTH_OVERFLOW_LIMIT = 3;

export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function startOfWeek(date: Date): Date {
  const d = startOfDay(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  return d;
}

export function endOfWeek(date: Date): Date {
  const d = startOfWeek(date);
  d.setDate(d.getDate() + 7);
  return d;
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

export function addWeeks(date: Date, weeks: number): Date {
  return addDays(date, weeks * 7);
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

export function formatMonthYear(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export function formatWeekRange(date: Date): string {
  const start = startOfWeek(date);
  const end = addDays(start, 6);
  const sameMonth = start.getMonth() === end.getMonth();
  const startFmt = start.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  const endFmt = end.toLocaleDateString("en-US", {
    month: sameMonth ? undefined : "short",
    day: "numeric",
    year: "numeric",
  });
  return `${startFmt} – ${endFmt}`;
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatDayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseDayKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function daysInMonthGrid(cursor: Date): Date[] {
  const first = startOfMonth(cursor);
  const start = startOfWeek(first);
  const days: Date[] = [];
  for (let i = 0; i < 42; i += 1) {
    days.push(addDays(start, i));
  }
  return days;
}

export function weekDays(cursor: Date): Date[] {
  const start = startOfWeek(cursor);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export function getMonthViewRange(cursor: Date): { start: Date; end: Date } {
  const days = daysInMonthGrid(cursor);
  return {
    start: startOfDay(days[0]),
    end: addDays(startOfDay(days[days.length - 1]), 1),
  };
}

export function getWeekViewRange(cursor: Date): { start: Date; end: Date } {
  return { start: startOfWeek(cursor), end: endOfWeek(cursor) };
}

export function snapToSlotMinutes(totalMinutes: number): number {
  return Math.round(totalMinutes / SLOT_MINUTES) * SLOT_MINUTES;
}

export function combineDayAndMinutes(day: Date, minutesFromMidnight: number): Date {
  const d = startOfDay(day);
  const snapped = snapToSlotMinutes(minutesFromMidnight);
  d.setHours(Math.floor(snapped / 60), snapped % 60, 0, 0);
  return d;
}

export function minutesFromMidnight(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

export function weekSlotCount(): number {
  return ((WEEK_END_HOUR - WEEK_START_HOUR) * 60) / SLOT_MINUTES;
}

export function slotIndexToMinutes(index: number): number {
  return WEEK_START_HOUR * 60 + index * SLOT_MINUTES;
}

export function toIsoString(date: Date): string {
  return date.toISOString();
}

export function fromIsoString(value: string): Date {
  return new Date(value);
}
