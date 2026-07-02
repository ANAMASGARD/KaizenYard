"use server";

import { and, count, eq, isNull } from "drizzle-orm";
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
import type { ProductivityOverview } from "@/lib/assistant/types";
import { requireUserId } from "@/lib/witness/require-user";

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
