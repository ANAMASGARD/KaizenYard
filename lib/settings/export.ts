import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import {
  calendarItemExceptions,
  calendarItems,
  calendarSettings,
  db,
  generatedApps,
  kanbanBoards,
  kanbanColumns,
  kanbanTasks,
  notes,
  pages,
  spaceFiles,
  spaces,
  userCategories,
  userSettings,
  whiteboards,
} from "@/db";

export async function buildUserExportPayload() {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const [
    settingsRows,
    categoryRows,
    calendarSettingRows,
    calendarItemRows,
    calendarExceptionRows,
    noteRows,
    boardRows,
    columnRows,
    taskRows,
    whiteboardRows,
    spaceRows,
    pageRows,
    fileRows,
    appRows,
  ] = await Promise.all([
    db.select().from(userSettings).where(eq(userSettings.clerkId, userId)),
    db.select().from(userCategories).where(eq(userCategories.clerkId, userId)),
    db.select().from(calendarSettings).where(eq(calendarSettings.clerkId, userId)),
    db.select().from(calendarItems).where(eq(calendarItems.clerkId, userId)),
    db
      .select()
      .from(calendarItemExceptions)
      .innerJoin(calendarItems, eq(calendarItemExceptions.itemId, calendarItems.id))
      .where(eq(calendarItems.clerkId, userId)),
    db.select().from(notes).where(eq(notes.clerkId, userId)),
    db.select().from(kanbanBoards).where(eq(kanbanBoards.clerkId, userId)),
    db.select().from(kanbanColumns).where(eq(kanbanColumns.clerkId, userId)),
    db.select().from(kanbanTasks).where(eq(kanbanTasks.clerkId, userId)),
    db.select().from(whiteboards).where(eq(whiteboards.clerkId, userId)),
    db.select().from(spaces).where(eq(spaces.clerkId, userId)),
    db.select().from(pages).where(eq(pages.clerkId, userId)),
    db.select().from(spaceFiles).where(eq(spaceFiles.clerkId, userId)),
    db.select().from(generatedApps).where(eq(generatedApps.clerkId, userId)),
  ]);

  return {
    exportedAt: new Date().toISOString(),
    version: "1.0.0",
    userId,
    settings: settingsRows[0] ?? null,
    categories: categoryRows,
    calendarSettings: calendarSettingRows[0] ?? null,
    calendarItems: calendarItemRows,
    calendarItemExceptions: calendarExceptionRows.map((row) => row.calendar_item_exceptions),
    notes: noteRows,
    kanbanBoards: boardRows,
    kanbanColumns: columnRows,
    kanbanTasks: taskRows,
    whiteboards: whiteboardRows.map((row) => ({
      ...row,
      content: row.content,
    })),
    spaces: spaceRows,
    pages: pageRows,
    spaceFiles: fileRows.map((file) => ({
      id: file.id,
      spaceId: file.spaceId,
      name: file.name,
      mimeType: file.mimeType,
      sizeBytes: file.sizeBytes,
      createdAt: file.createdAt,
      updatedAt: file.updatedAt,
    })),
    generatedApps: appRows,
  };
}
