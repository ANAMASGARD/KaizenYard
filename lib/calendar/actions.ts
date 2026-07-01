"use server";

import { auth } from "@clerk/nextjs/server";
import { and, eq, gte, inArray, isNull, lt, or, sql } from "drizzle-orm";
import {
  calendarItemExceptions,
  calendarItems,
  calendarSettings,
  db,
} from "@/db";
import {
  isCalendarCategory,
  isCalendarItemType,
} from "@/lib/calendar/categories";
import { expandOccurrences } from "@/lib/calendar/recurrence";
import type {
  CalendarItemRecord,
  CalendarSettingsRecord,
  CreateCalendarItemInput,
  EditScope,
  UpdateCalendarItemInput,
} from "@/lib/calendar/types";
import { makeOccurrenceKey } from "@/lib/calendar/types";

async function requireUserId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }
  return userId;
}

function toBaseRecord(
  row: typeof calendarItems.$inferSelect,
): Omit<CalendarItemRecord, "occurrenceKey" | "originalStartAt" | "isRecurringInstance"> {
  return {
    id: row.id,
    clerkId: row.clerkId,
    title: row.title,
    itemType: row.itemType as CalendarItemRecord["itemType"],
    category: row.category as CalendarItemRecord["category"],
    description: row.description,
    location: row.location,
    scheduledAt: row.scheduledAt ? row.scheduledAt.toISOString() : null,
    durationMin: row.durationMin,
    recurrenceRule: row.recurrenceRule,
    bufferBeforeMin: row.bufferBeforeMin,
    bufferAfterMin: row.bufferAfterMin,
    isPrivate: row.isPrivate,
    attendeeCount: row.attendeeCount,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toOccurrenceRecord(
  base: ReturnType<typeof toBaseRecord>,
  scheduledAt: string,
  originalStartAt?: string,
): CalendarItemRecord {
  const isRecurring = Boolean(base.recurrenceRule && originalStartAt);
  return {
    ...base,
    scheduledAt,
    occurrenceKey: makeOccurrenceKey(
      base.id,
      isRecurring ? originalStartAt : undefined,
    ),
    originalStartAt: isRecurring ? originalStartAt : undefined,
    isRecurringInstance: isRecurring,
  };
}

export async function listCalendarItems(
  rangeStartIso: string,
  rangeEndIso: string,
): Promise<CalendarItemRecord[]> {
  const userId = await requireUserId();
  const rangeStart = new Date(rangeStartIso);
  const rangeEnd = new Date(rangeEndIso);

  const rows = await db
    .select()
    .from(calendarItems)
    .where(
      and(
        eq(calendarItems.clerkId, userId),
        or(
          isNull(calendarItems.scheduledAt),
          and(
            gte(calendarItems.scheduledAt, rangeStart),
            lt(calendarItems.scheduledAt, rangeEnd),
          ),
          sql`${calendarItems.recurrenceRule} IS NOT NULL`,
        ),
      ),
    )
    .orderBy(calendarItems.scheduledAt);

  const itemIds = rows.map((r) => r.id);
  const exceptions =
    itemIds.length > 0
      ? await db
          .select()
          .from(calendarItemExceptions)
          .where(inArray(calendarItemExceptions.itemId, itemIds))
      : [];

  const exceptionsByItem = exceptions.reduce<
    Record<number, typeof exceptions>
  >((acc, exc) => {
    acc[exc.itemId] = acc[exc.itemId] ? [...acc[exc.itemId], exc] : [exc];
    return acc;
  }, {});

  const results: CalendarItemRecord[] = [];

  for (const row of rows) {
    const base = toBaseRecord(row);

    if (!row.scheduledAt) {
      results.push({
        ...base,
        occurrenceKey: makeOccurrenceKey(row.id),
      });
      continue;
    }

    const itemExceptions = (exceptionsByItem[row.id] ?? []).map((e) => ({
      originalStartAt: e.originalStartAt.toISOString(),
      status: e.status as "modified" | "cancelled",
      overrideScheduledAt: e.overrideScheduledAt
        ? e.overrideScheduledAt.toISOString()
        : null,
      overrideDurationMin: e.overrideDurationMin,
      overrideTitle: e.overrideTitle,
    }));

    const expanded = expandOccurrences(
      {
        ...base,
        scheduledAt: base.scheduledAt,
      },
      rangeStart,
      rangeEnd,
      itemExceptions,
    );

    for (const occ of expanded) {
      if (!occ.scheduledAt) continue;
      results.push(
        toOccurrenceRecord(
          base,
          occ.scheduledAt,
          row.recurrenceRule ? occ.originalStartAt : undefined,
        ),
      );
    }
  }

  return results;
}

export async function listCalendarItemsForExport(): Promise<CalendarItemRecord[]> {
  const now = new Date();
  const rangeStart = new Date(now);
  rangeStart.setMonth(rangeStart.getMonth() - 3);
  const rangeEnd = new Date(now);
  rangeEnd.setMonth(rangeEnd.getMonth() + 12);
  return listCalendarItems(rangeStart.toISOString(), rangeEnd.toISOString());
}

export async function createCalendarItem(
  input: CreateCalendarItemInput,
): Promise<CalendarItemRecord> {
  const userId = await requireUserId();

  if (!input.title.trim()) {
    throw new Error("Title is required");
  }
  if (!isCalendarItemType(input.itemType)) {
    throw new Error("Invalid item type");
  }
  if (!isCalendarCategory(input.category)) {
    throw new Error("Invalid category");
  }

  const [row] = await db
    .insert(calendarItems)
    .values({
      clerkId: userId,
      title: input.title.trim(),
      itemType: input.itemType,
      category: input.category,
      description: input.description?.trim() || null,
      location: input.location?.trim() || null,
      scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null,
      durationMin: input.durationMin ?? 60,
      recurrenceRule: input.recurrenceRule ?? null,
      bufferBeforeMin: input.bufferBeforeMin ?? 0,
      bufferAfterMin: input.bufferAfterMin ?? 0,
      isPrivate: input.isPrivate ?? false,
      attendeeCount: input.attendeeCount ?? 1,
    })
    .returning();

  const base = toBaseRecord(row);
  return {
    ...base,
    occurrenceKey: makeOccurrenceKey(row.id),
  };
}

export async function updateCalendarItem(
  id: number,
  input: UpdateCalendarItemInput,
  scope: EditScope = "series",
  originalStartAt?: string,
): Promise<CalendarItemRecord> {
  const userId = await requireUserId();

  if (input.itemType && !isCalendarItemType(input.itemType)) {
    throw new Error("Invalid item type");
  }
  if (input.category && !isCalendarCategory(input.category)) {
    throw new Error("Invalid category");
  }

  const [existing] = await db
    .select()
    .from(calendarItems)
    .where(and(eq(calendarItems.id, id), eq(calendarItems.clerkId, userId)));

  if (!existing) {
    throw new Error("Item not found");
  }

  if (scope === "occurrence" && originalStartAt && existing.recurrenceRule) {
    const [exc] = await db
      .insert(calendarItemExceptions)
      .values({
        itemId: id,
        originalStartAt: new Date(originalStartAt),
        status: "modified",
        overrideScheduledAt: input.scheduledAt
          ? new Date(input.scheduledAt)
          : new Date(originalStartAt),
        overrideDurationMin: input.durationMin ?? existing.durationMin,
        overrideTitle: input.title?.trim() ?? existing.title,
      })
      .onConflictDoUpdate({
        target: [
          calendarItemExceptions.itemId,
          calendarItemExceptions.originalStartAt,
        ],
        set: {
          status: "modified",
          overrideScheduledAt: input.scheduledAt
            ? new Date(input.scheduledAt)
            : new Date(originalStartAt),
          overrideDurationMin: input.durationMin ?? existing.durationMin,
          overrideTitle: input.title?.trim() ?? existing.title,
          updatedAt: sql`now()`,
        },
      })
      .returning();

    const base = toBaseRecord(existing);
    const scheduledAt = (
      exc.overrideScheduledAt ?? new Date(originalStartAt)
    ).toISOString();
    return toOccurrenceRecord(base, scheduledAt, originalStartAt);
  }

  const [row] = await db
    .update(calendarItems)
    .set({
      ...(input.title !== undefined ? { title: input.title.trim() } : {}),
      ...(input.itemType !== undefined ? { itemType: input.itemType } : {}),
      ...(input.category !== undefined ? { category: input.category } : {}),
      ...(input.description !== undefined
        ? { description: input.description?.trim() || null }
        : {}),
      ...(input.location !== undefined
        ? { location: input.location?.trim() || null }
        : {}),
      ...(input.durationMin !== undefined
        ? { durationMin: input.durationMin }
        : {}),
      ...(input.scheduledAt !== undefined
        ? {
            scheduledAt: input.scheduledAt
              ? new Date(input.scheduledAt)
              : null,
          }
        : {}),
      ...(input.recurrenceRule !== undefined
        ? { recurrenceRule: input.recurrenceRule }
        : {}),
      ...(input.bufferBeforeMin !== undefined
        ? { bufferBeforeMin: input.bufferBeforeMin }
        : {}),
      ...(input.bufferAfterMin !== undefined
        ? { bufferAfterMin: input.bufferAfterMin }
        : {}),
      ...(input.isPrivate !== undefined ? { isPrivate: input.isPrivate } : {}),
      ...(input.attendeeCount !== undefined
        ? { attendeeCount: input.attendeeCount }
        : {}),
      updatedAt: sql`now()`,
    })
    .where(and(eq(calendarItems.id, id), eq(calendarItems.clerkId, userId)))
    .returning();

  if (!row) {
    throw new Error("Item not found");
  }

  const base = toBaseRecord(row);
  return {
    ...base,
    occurrenceKey: makeOccurrenceKey(row.id),
  };
}

export async function scheduleCalendarItem(
  occurrenceKey: string,
  scheduledAtIso: string,
): Promise<CalendarItemRecord> {
  const { id, originalStartAt } = parseOccurrenceKeyFromString(occurrenceKey);
  if (originalStartAt) {
    return updateCalendarItem(
      id,
      { scheduledAt: scheduledAtIso },
      "occurrence",
      originalStartAt,
    );
  }
  return updateCalendarItem(id, { scheduledAt: scheduledAtIso });
}

export async function unscheduleCalendarItem(
  occurrenceKey: string,
): Promise<CalendarItemRecord> {
  const { id } = parseOccurrenceKeyFromString(occurrenceKey);
  return updateCalendarItem(id, { scheduledAt: null });
}

export async function deleteCalendarItem(
  occurrenceKey: string,
  scope: EditScope = "series",
): Promise<void> {
  const userId = await requireUserId();
  const { id, originalStartAt } = parseOccurrenceKeyFromString(occurrenceKey);

  if (scope === "occurrence" && originalStartAt) {
    await db
      .insert(calendarItemExceptions)
      .values({
        itemId: id,
        originalStartAt: new Date(originalStartAt),
        status: "cancelled",
      })
      .onConflictDoUpdate({
        target: [
          calendarItemExceptions.itemId,
          calendarItemExceptions.originalStartAt,
        ],
        set: {
          status: "cancelled",
          updatedAt: sql`now()`,
        },
      });
    return;
  }

  const result = await db
    .delete(calendarItems)
    .where(and(eq(calendarItems.id, id), eq(calendarItems.clerkId, userId)))
    .returning({ id: calendarItems.id });

  if (result.length === 0) {
    throw new Error("Item not found");
  }
}

function parseOccurrenceKeyFromString(key: string): {
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

export async function getCalendarSettings(): Promise<CalendarSettingsRecord> {
  const userId = await requireUserId();

  const [row] = await db
    .select()
    .from(calendarSettings)
    .where(eq(calendarSettings.clerkId, userId));

  if (row) {
    return {
      weeklyFocusGoalHours: row.weeklyFocusGoalHours,
      noMeetingWeekdays: row.noMeetingWeekdays ?? [],
      workDayStartMin: row.workDayStartMin,
      workDayEndMin: row.workDayEndMin,
      avgHourlyRateCents: row.avgHourlyRateCents,
    };
  }

  const [created] = await db
    .insert(calendarSettings)
    .values({ clerkId: userId })
    .returning();

  return {
    weeklyFocusGoalHours: created.weeklyFocusGoalHours,
    noMeetingWeekdays: created.noMeetingWeekdays ?? [],
    workDayStartMin: created.workDayStartMin,
    workDayEndMin: created.workDayEndMin,
    avgHourlyRateCents: created.avgHourlyRateCents,
  };
}

export async function updateCalendarSettings(
  input: Partial<CalendarSettingsRecord>,
): Promise<CalendarSettingsRecord> {
  const userId = await requireUserId();
  await getCalendarSettings();

  const [row] = await db
    .update(calendarSettings)
    .set({
      ...(input.weeklyFocusGoalHours !== undefined
        ? { weeklyFocusGoalHours: input.weeklyFocusGoalHours }
        : {}),
      ...(input.noMeetingWeekdays !== undefined
        ? { noMeetingWeekdays: input.noMeetingWeekdays }
        : {}),
      ...(input.workDayStartMin !== undefined
        ? { workDayStartMin: input.workDayStartMin }
        : {}),
      ...(input.workDayEndMin !== undefined
        ? { workDayEndMin: input.workDayEndMin }
        : {}),
      ...(input.avgHourlyRateCents !== undefined
        ? { avgHourlyRateCents: input.avgHourlyRateCents }
        : {}),
      updatedAt: sql`now()`,
    })
    .where(eq(calendarSettings.clerkId, userId))
    .returning();

  return {
    weeklyFocusGoalHours: row.weeklyFocusGoalHours,
    noMeetingWeekdays: row.noMeetingWeekdays ?? [],
    workDayStartMin: row.workDayStartMin,
    workDayEndMin: row.workDayEndMin,
    avgHourlyRateCents: row.avgHourlyRateCents,
  };
}
