"use server";

import { currentUser } from "@clerk/nextjs/server";
import { and, asc, count, eq, isNotNull, isNull, lte } from "drizzle-orm";
import {
  calendarItems,
  db,
  generatedApps,
  kanbanBoards,
  kanbanTasks,
  notes,
  pages,
  spaces,
  whiteboards,
} from "@/db";
import { listCalendarItems, getCalendarSettings } from "@/lib/calendar/actions";
import { getWeekViewRange } from "@/lib/calendar/date-utils";
import {
  computeFragmentationScore,
  computeWeeklyScheduledHours,
} from "@/lib/calendar/focus-utils";
import { listAssistantSessions } from "@/lib/assistant/sessions/actions";
import { listNotes } from "@/lib/notes/actions";
import { listPinnedGeneratedApps } from "@/lib/templates/actions";
import { getUserSettings } from "@/lib/settings/actions";
import {
  getAgentWitnessVerifierContractId,
  getStellarConfig,
  getVaultVerifierContractId,
  STELLAR_NETWORK,
} from "@/lib/stellar/config";
import { requireUserId } from "@/lib/witness/require-user";
import {
  getTimezoneDayRange,
} from "@/lib/dashboard/date-utils";
import type {
  DashboardSnapshot,
  ProductivityOverview,
} from "@/lib/dashboard/types";

export async function getProductivityOverview(): Promise<ProductivityOverview> {
  const userId = await requireUserId();

  const [
    calendarCount,
    boardCount,
    taskCount,
    noteCount,
    whiteboardCount,
    spaceCount,
    pageCount,
    appCount,
  ] = await Promise.all([
    db
      .select({ value: count() })
      .from(calendarItems)
      .where(eq(calendarItems.clerkId, userId)),
    db
      .select({ value: count() })
      .from(kanbanBoards)
      .where(eq(kanbanBoards.clerkId, userId)),
    db
      .select({ value: count() })
      .from(kanbanTasks)
      .where(eq(kanbanTasks.clerkId, userId)),
    db
      .select({ value: count() })
      .from(notes)
      .where(and(eq(notes.clerkId, userId), isNull(notes.deletedAt))),
    db
      .select({ value: count() })
      .from(whiteboards)
      .where(and(eq(whiteboards.clerkId, userId), isNull(whiteboards.deletedAt))),
    db
      .select({ value: count() })
      .from(spaces)
      .where(and(eq(spaces.clerkId, userId), isNull(spaces.deletedAt))),
    db
      .select({ value: count() })
      .from(pages)
      .where(and(eq(pages.clerkId, userId), isNull(pages.deletedAt))),
    db
      .select({ value: count() })
      .from(generatedApps)
      .where(eq(generatedApps.clerkId, userId)),
  ]);

  return {
    calendarItemCount: calendarCount[0]?.value ?? 0,
    boardCount: boardCount[0]?.value ?? 0,
    taskCount: taskCount[0]?.value ?? 0,
    noteCount: noteCount[0]?.value ?? 0,
    whiteboardCount: whiteboardCount[0]?.value ?? 0,
    spaceCount: spaceCount[0]?.value ?? 0,
    pageCount: pageCount[0]?.value ?? 0,
    generatedAppCount: appCount[0]?.value ?? 0,
  };
}

function resolveUserName(
  clerkUser: Awaited<ReturnType<typeof currentUser>>,
): string {
  if (!clerkUser) return "there";
  const first = clerkUser.firstName?.trim();
  if (first) return first;
  const email = clerkUser.primaryEmailAddress?.emailAddress;
  if (email) return email.split("@")[0] ?? "there";
  return "there";
}

export async function getDashboardSnapshot(): Promise<DashboardSnapshot> {
  const userId = await requireUserId();
  const clerkUser = await currentUser();
  const settings = await getUserSettings();
  const timezone = settings.timezone || "UTC";
  const now = new Date();
  const { start: dayStart, end: dayEnd } = getTimezoneDayRange(timezone, now);

  const weekAhead = new Date(now);
  weekAhead.setDate(weekAhead.getDate() + 7);

  const [
    overview,
    todayEvents,
    calendarSettings,
    weekEvents,
    allNotes,
    upcomingTaskRows,
    assistantSessions,
    pinnedApps,
    vaultSpaceRows,
  ] = await Promise.all([
    getProductivityOverview(),
    listCalendarItems(dayStart.toISOString(), dayEnd.toISOString()),
    getCalendarSettings(),
    (async () => {
      const { start, end } = getWeekViewRange(now);
      return listCalendarItems(start.toISOString(), end.toISOString());
    })(),
    listNotes(),
    db
      .select({
        id: kanbanTasks.id,
        title: kanbanTasks.title,
        dueDate: kanbanTasks.dueDate,
      })
      .from(kanbanTasks)
      .where(
        and(
          eq(kanbanTasks.clerkId, userId),
          isNotNull(kanbanTasks.dueDate),
          lte(kanbanTasks.dueDate, weekAhead),
        ),
      )
      .orderBy(asc(kanbanTasks.dueDate))
      .limit(5),
    listAssistantSessions(),
    listPinnedGeneratedApps(),
    db
      .select({ value: count() })
      .from(spaces)
      .where(
        and(
          eq(spaces.clerkId, userId),
          eq(spaces.isVault, true),
          isNull(spaces.deletedAt),
        ),
      ),
  ]);

  const { start: weekStart, end: weekEnd } = getWeekViewRange(now);
  const scheduledHours = computeWeeklyScheduledHours(weekEvents, weekStart, weekEnd);
  const fragmentation = computeFragmentationScore(
    weekEvents,
    weekStart,
    weekEnd,
    calendarSettings,
  );
  const focusRemaining = Math.max(
    0,
    calendarSettings.weeklyFocusGoalHours - scheduledHours,
  );
  const progressPercent = Math.min(
    100,
    (scheduledHours / Math.max(calendarSettings.weeklyFocusGoalHours, 1)) * 100,
  );

  const sortedToday = [...todayEvents]
    .filter((e) => e.scheduledAt)
    .sort(
      (a, b) =>
        new Date(a.scheduledAt!).getTime() - new Date(b.scheduledAt!).getTime(),
    );

  const stellarConfig = getStellarConfig();

  return {
    userName: resolveUserName(clerkUser),
    timezone,
    todayLabel: now.toLocaleDateString(undefined, {
      timeZone: timezone,
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    }),
    overview,
    todayEvents: sortedToday,
    focus: {
      weeklyFocusGoalHours: calendarSettings.weeklyFocusGoalHours,
      scheduledHours,
      focusRemainingHours: focusRemaining,
      fragmentation,
      progressPercent,
    },
    recentNotes: allNotes.slice(0, 5).map((n) => ({
      id: n.id,
      title: n.title,
      updatedAt: n.updatedAt,
    })),
    upcomingTasks: upcomingTaskRows.map((t) => ({
      id: t.id,
      title: t.title,
      dueDate: t.dueDate!.toISOString(),
      isOverdue: t.dueDate!.getTime() < now.getTime(),
    })),
    recentAssistantSessions: assistantSessions.slice(0, 3).map((s) => ({
      id: s.id,
      title: s.title,
      privacyMode: s.privacyMode,
      lastMessageAt: s.lastMessageAt,
    })),
    pinnedApps,
    web3: {
      network: STELLAR_NETWORK,
      networkLabel: stellarConfig.networkLabel,
      vaultContractId: getVaultVerifierContractId(),
      witnessContractId: getAgentWitnessVerifierContractId(),
      vaultSpaceCount: vaultSpaceRows[0]?.value ?? 0,
    },
  };
}
