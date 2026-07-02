"use server";

import { auth } from "@clerk/nextjs/server";
import { eq, sql } from "drizzle-orm";
import { db, userSettings } from "@/db";
import { DEFAULT_USER_SETTINGS } from "@/lib/settings/defaults";
import type {
  AiBehavior,
  AiFeatures,
  AiTone,
  CalendarView,
  NotificationSettings,
  TimeFormat,
  UserSettingsRecord,
} from "@/lib/settings/types";

async function requireUserId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }
  return userId;
}

function rowToRecord(row: typeof userSettings.$inferSelect): UserSettingsRecord {
  return {
    defaultCalendarView: row.defaultCalendarView as CalendarView,
    defaultTaskPriority: row.defaultTaskPriority,
    dateFormat: row.dateFormat,
    timeFormat: row.timeFormat as TimeFormat,
    weekStartsOn: row.weekStartsOn,
    autoSave: row.autoSave,
    compactMode: row.compactMode,
    showCompletedTasks: row.showCompletedTasks,
    timezone: row.timezone,
    locale: row.locale,
    accentColor: row.accentColor,
    aiModel: row.aiModel,
    aiBehavior: row.aiBehavior as AiBehavior,
    aiTone: row.aiTone as AiTone,
    aiOutputLanguage: row.aiOutputLanguage,
    aiFeatures: row.aiFeatures as AiFeatures,
    allowAiDataUsage: row.allowAiDataUsage,
    notifications: row.notifications as NotificationSettings,
  };
}

export async function getUserSettings(): Promise<UserSettingsRecord> {
  const userId = await requireUserId();

  const [row] = await db
    .select()
    .from(userSettings)
    .where(eq(userSettings.clerkId, userId));

  if (row) {
    return rowToRecord(row);
  }

  const [created] = await db
    .insert(userSettings)
    .values({ clerkId: userId })
    .returning();

  return rowToRecord(created);
}

export async function updateUserSettings(
  input: Partial<UserSettingsRecord>,
): Promise<UserSettingsRecord> {
  const userId = await requireUserId();
  await getUserSettings();

  const [row] = await db
    .update(userSettings)
    .set({
      ...(input.defaultCalendarView !== undefined
        ? { defaultCalendarView: input.defaultCalendarView }
        : {}),
      ...(input.defaultTaskPriority !== undefined
        ? { defaultTaskPriority: input.defaultTaskPriority }
        : {}),
      ...(input.dateFormat !== undefined ? { dateFormat: input.dateFormat } : {}),
      ...(input.timeFormat !== undefined ? { timeFormat: input.timeFormat } : {}),
      ...(input.weekStartsOn !== undefined ? { weekStartsOn: input.weekStartsOn } : {}),
      ...(input.autoSave !== undefined ? { autoSave: input.autoSave } : {}),
      ...(input.compactMode !== undefined ? { compactMode: input.compactMode } : {}),
      ...(input.showCompletedTasks !== undefined
        ? { showCompletedTasks: input.showCompletedTasks }
        : {}),
      ...(input.timezone !== undefined ? { timezone: input.timezone } : {}),
      ...(input.locale !== undefined ? { locale: input.locale } : {}),
      ...(input.accentColor !== undefined ? { accentColor: input.accentColor } : {}),
      ...(input.aiModel !== undefined ? { aiModel: input.aiModel } : {}),
      ...(input.aiBehavior !== undefined ? { aiBehavior: input.aiBehavior } : {}),
      ...(input.aiTone !== undefined ? { aiTone: input.aiTone } : {}),
      ...(input.aiOutputLanguage !== undefined
        ? { aiOutputLanguage: input.aiOutputLanguage }
        : {}),
      ...(input.aiFeatures !== undefined ? { aiFeatures: input.aiFeatures } : {}),
      ...(input.allowAiDataUsage !== undefined
        ? { allowAiDataUsage: input.allowAiDataUsage }
        : {}),
      ...(input.notifications !== undefined ? { notifications: input.notifications } : {}),
      updatedAt: sql`now()`,
    })
    .where(eq(userSettings.clerkId, userId))
    .returning();

  return rowToRecord(row);
}

export async function updateAiFeatures(
  patch: Partial<AiFeatures>,
): Promise<UserSettingsRecord> {
  const current = await getUserSettings();
  return updateUserSettings({
    aiFeatures: { ...current.aiFeatures, ...patch },
  });
}

export async function updateNotifications(
  patch: Partial<NotificationSettings>,
): Promise<UserSettingsRecord> {
  const current = await getUserSettings();
  return updateUserSettings({
    notifications: { ...current.notifications, ...patch },
  });
}
