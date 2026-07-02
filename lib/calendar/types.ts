import type { CalendarItemType } from "@/lib/calendar/categories";

export type CalendarView = "month" | "week";

export type EditScope = "occurrence" | "series";

export type RecurrencePreset =
  | "none"
  | "daily"
  | "weekdays"
  | "weekly"
  | "monthly"
  | "yearly";

export type RecurrenceEndType = "never" | "on_date" | "after_count";

export type CalendarItemRecord = {
  id: number;
  clerkId: string;
  title: string;
  itemType: CalendarItemType;
  category: string;
  description: string | null;
  location: string | null;
  scheduledAt: string | null;
  durationMin: number;
  recurrenceRule: string | null;
  bufferBeforeMin: number;
  bufferAfterMin: number;
  isPrivate: boolean;
  attendeeCount: number;
  createdAt: string;
  updatedAt: string;
  /** Virtual occurrence id: "42" or "42:2026-05-15T09:00:00.000Z" */
  occurrenceKey: string;
  /** For recurring instances — the series occurrence start before overrides */
  originalStartAt?: string;
  isRecurringInstance?: boolean;
};

export type CreateCalendarItemInput = {
  title: string;
  itemType: CalendarItemType;
  category: string;
  description?: string | null;
  location?: string | null;
  scheduledAt?: string | null;
  durationMin?: number;
  recurrenceRule?: string | null;
  bufferBeforeMin?: number;
  bufferAfterMin?: number;
  isPrivate?: boolean;
  attendeeCount?: number;
};

export type UpdateCalendarItemInput = Partial<CreateCalendarItemInput>;

export type EventDialogDefaults = {
  dayKey?: string;
  slotMinutes?: number;
  item?: CalendarItemRecord;
};

export type CalendarSettingsRecord = {
  weeklyFocusGoalHours: number;
  noMeetingWeekdays: number[];
  workDayStartMin: number;
  workDayEndMin: number;
  avgHourlyRateCents: number;
};

export type PulseVoteType = "keep" | "drop" | "unsure";

export type PulseTally = {
  keep: number;
  drop: number;
  unsure: number;
  total: number;
};

export type MeetingPulseRecord = {
  id: number;
  calendarItemId: number | null;
  question: string;
  shareToken: string;
  pulseType?: string;
  witnessGroupId?: number | null;
  isOpen: boolean;
  closesAt: string | null;
  tally: PulseTally;
  hasVoted: boolean;
  userVote: PulseVoteType | null;
  sharePath?: string;
};

export const DRAFT_DROP_ID = "draft-panel-drop";
export const EVENT_DRAG_PREFIX = "event-";

export function makeOccurrenceKey(id: number, originalStartIso?: string): string {
  if (!originalStartIso) return String(id);
  return `${id}:${originalStartIso}`;
}

export function parseOccurrenceKey(key: string): {
  id: number;
  originalStartAt?: string;
} {
  const colon = key.indexOf(":");
  if (colon === -1) {
    return { id: Number(key) };
  }
  return {
    id: Number(key.slice(0, colon)),
    originalStartAt: key.slice(colon + 1),
  };
}

export function eventDragId(occurrenceKey: string): string {
  return `${EVENT_DRAG_PREFIX}${occurrenceKey}`;
}

export function parseEventDragId(id: string): string | null {
  if (!id.startsWith(EVENT_DRAG_PREFIX)) return null;
  return id.slice(EVENT_DRAG_PREFIX.length);
}

export function monthDayDropId(dayKey: string): string {
  return `month-day-${dayKey}`;
}

export function weekSlotDropId(dayKey: string, slotIndex: number): string {
  return `week-slot-${dayKey}-${slotIndex}`;
}

export function parseMonthDayDropId(id: string): string | null {
  if (!id.startsWith("month-day-")) return null;
  return id.slice("month-day-".length);
}

export function parseWeekSlotDropId(
  id: string,
): { dayKey: string; slotIndex: number } | null {
  if (!id.startsWith("week-slot-")) return null;
  const rest = id.slice("week-slot-".length);
  const lastDash = rest.lastIndexOf("-");
  if (lastDash === -1) return null;
  const dayKey = rest.slice(0, lastDash);
  const slotIndex = Number(rest.slice(lastDash + 1));
  if (!Number.isFinite(slotIndex)) return null;
  return { dayKey, slotIndex };
}
