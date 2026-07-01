import { RRule, rrulestr } from "rrule";
import type { RecurrenceEndType, RecurrencePreset } from "@/lib/calendar/types";

export const RECURRENCE_PRESETS: { id: RecurrencePreset; label: string }[] = [
  { id: "none", label: "Does not repeat" },
  { id: "daily", label: "Daily" },
  { id: "weekdays", label: "Every weekday" },
  { id: "weekly", label: "Weekly" },
  { id: "monthly", label: "Monthly" },
  { id: "yearly", label: "Yearly" },
];

export const RECURRENCE_END_TYPES: { id: RecurrenceEndType; label: string }[] = [
  { id: "never", label: "Never" },
  { id: "on_date", label: "On date" },
  { id: "after_count", label: "After" },
];

export type BuildRecurrenceInput = {
  preset: RecurrencePreset;
  dtstart: Date;
  endType: RecurrenceEndType;
  endDate?: Date;
  endCount?: number;
};

export function buildRecurrenceRule(input: BuildRecurrenceInput): string | null {
  if (input.preset === "none") return null;

  const options: Partial<ConstructorParameters<typeof RRule>[0]> = {
    dtstart: input.dtstart,
  };

  switch (input.preset) {
    case "daily":
      options.freq = RRule.DAILY;
      break;
    case "weekdays":
      options.freq = RRule.WEEKLY;
      options.byweekday = [RRule.MO, RRule.TU, RRule.WE, RRule.TH, RRule.FR];
      break;
    case "weekly":
      options.freq = RRule.WEEKLY;
      break;
    case "monthly":
      options.freq = RRule.MONTHLY;
      break;
    case "yearly":
      options.freq = RRule.YEARLY;
      break;
    default: {
      const _exhaustive: never = input.preset;
      return _exhaustive;
    }
  }

  if (input.endType === "on_date" && input.endDate) {
    options.until = input.endDate;
  } else if (input.endType === "after_count" && input.endCount) {
    options.count = input.endCount;
  }

  const rule = new RRule(options);
  const str = rule.toString();
  const rruleLine = str.split("\n").find((l) => l.startsWith("RRULE:"));
  return rruleLine ? rruleLine.replace("RRULE:", "") : null;
}

export function parseRecurrencePreset(rule: string | null): RecurrencePreset {
  if (!rule) return "none";
  const upper = rule.toUpperCase();
  if (upper.includes("FREQ=DAILY")) return "daily";
  if (upper.includes("FREQ=WEEKLY") && upper.includes("BYDAY=MO,TU,WE,TH,FR"))
    return "weekdays";
  if (upper.includes("FREQ=WEEKLY")) return "weekly";
  if (upper.includes("FREQ=MONTHLY")) return "monthly";
  if (upper.includes("FREQ=YEARLY")) return "yearly";
  return "weekly";
}

export type CalendarExceptionRow = {
  originalStartAt: string;
  status: "modified" | "cancelled";
  overrideScheduledAt: string | null;
  overrideDurationMin: number | null;
  overrideTitle: string | null;
};

export type ExpandableItem = {
  id: number;
  clerkId: string;
  title: string;
  itemType: string;
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
};

export type ExpandedOccurrence = ExpandableItem & {
  originalStartAt: string;
};

export function expandOccurrences(
  item: ExpandableItem,
  rangeStart: Date,
  rangeEnd: Date,
  exceptions: CalendarExceptionRow[] = [],
): ExpandedOccurrence[] {
  if (!item.scheduledAt) {
    return [];
  }

  if (!item.recurrenceRule) {
    const start = new Date(item.scheduledAt);
    if (start >= rangeStart && start < rangeEnd) {
      return [{ ...item, originalStartAt: item.scheduledAt }];
    }
    return [];
  }

  const dtstart = new Date(item.scheduledAt);
  const ruleStr = `DTSTART:${dtstart.toISOString().replace(/[-:]/g, "").split(".")[0]}Z\nRRULE:${item.recurrenceRule}`;
  let rule: RRule;
  try {
    rule = rrulestr(ruleStr) as RRule;
  } catch {
    const start = new Date(item.scheduledAt);
    if (start >= rangeStart && start < rangeEnd) {
      return [{ ...item, originalStartAt: item.scheduledAt }];
    }
    return [];
  }

  const dates = rule.between(rangeStart, rangeEnd, true);
  const exceptionMap = new Map(
    exceptions.map((e) => [new Date(e.originalStartAt).toISOString(), e]),
  );

  const results: ExpandedOccurrence[] = [];

  for (const date of dates) {
    const originalIso = date.toISOString();
    const exc = exceptionMap.get(originalIso);
    if (exc?.status === "cancelled") continue;

    const scheduledAt = exc?.overrideScheduledAt ?? originalIso;
    const durationMin = exc?.overrideDurationMin ?? item.durationMin;
    const title = exc?.overrideTitle ?? item.title;

    results.push({
      ...item,
      title,
      scheduledAt,
      durationMin,
      originalStartAt: originalIso,
    });
  }

  return results;
}
