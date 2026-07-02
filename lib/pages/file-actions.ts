"use server";

import { auth } from "@clerk/nextjs/server";
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { db, spaceFiles } from "@/db";
import {
  getSpaceRole,
  requireSpaceAccess,
} from "@/lib/pages/access";
import { resolveInitialsForClerkIds } from "@/lib/pages/user-display";
import type { SpaceFileListItem } from "@/lib/pages/types";
import type { SpaceRole } from "@/lib/pages/room";

const MAX_FILE_BYTES = 5 * 1024 * 1024;

async function requireUserId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }
  return userId;
}

function toFileListItem(
  row: typeof spaceFiles.$inferSelect,
  role: SpaceRole,
  authorInitials: string,
): SpaceFileListItem {
  return {
    id: row.id,
    spaceId: row.spaceId,
    pageId: row.pageId,
    clerkId: row.clerkId,
    name: row.name,
    mimeType: row.mimeType,
    sizeBytes: row.sizeBytes,
    isFavorite: row.isFavorite,
    archivedAt: row.archivedAt ? row.archivedAt.toISOString() : null,
    role,
    authorInitials,
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function countFilesForSpace(spaceId: number): Promise<number> {
  const [result] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(spaceFiles)
    .where(and(eq(spaceFiles.spaceId, spaceId), isNull(spaceFiles.deletedAt)));
  return result?.count ?? 0;
}

export async function listFilesInSpace(
  spaceId: number,
): Promise<SpaceFileListItem[]> {
  const userId = await requireUserId();
  const role = await requireSpaceAccess(spaceId, userId, "viewer");

  const rows = await db
    .select()
    .from(spaceFiles)
    .where(
      and(
        eq(spaceFiles.spaceId, spaceId),
        isNull(spaceFiles.deletedAt),
        isNull(spaceFiles.archivedAt),
      ),
    )
    .orderBy(desc(spaceFiles.isFavorite), desc(spaceFiles.updatedAt));

  const initials = await resolveInitialsForClerkIds(rows.map((row) => row.clerkId));

  return rows.map((row) =>
    toFileListItem(row, role, initials.get(row.clerkId) ?? "??"),
  );
}

export async function uploadSpaceFile(
  formData: FormData,
): Promise<SpaceFileListItem> {
  const userId = await requireUserId();
  const spaceId = Number(formData.get("spaceId"));
  if (!Number.isFinite(spaceId)) {
    throw new Error("Invalid space");
  }

  const role = await requireSpaceAccess(spaceId, userId, "editor");
  const file = formData.get("file");
  if (!(file instanceof File)) {
    throw new Error("No file provided");
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new Error("File must be under 5 MB");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const dataBase64 = buffer.toString("base64");

  const [maxOrder] = await db
    .select({ max: sql<number>`coalesce(max(${spaceFiles.sortOrder}), -1)` })
    .from(spaceFiles)
    .where(and(eq(spaceFiles.spaceId, spaceId), isNull(spaceFiles.deletedAt)));

  const [row] = await db
    .insert(spaceFiles)
    .values({
      spaceId,
      clerkId: userId,
      name: file.name.trim() || "Untitled file",
      mimeType: file.type || "application/octet-stream",
      sizeBytes: file.size,
      dataBase64,
      sortOrder: (maxOrder?.max ?? -1) + 1,
    })
    .returning();

  await db
    .update(spaceFiles)
    .set({ updatedAt: sql`now()` })
    .where(eq(spaceFiles.id, row.id));

  const initials = await resolveInitialsForClerkIds([userId]);
  return toFileListItem(row, role, initials.get(userId) ?? "??");
}

export async function getSpaceFileDownload(
  fileId: number,
): Promise<{ name: string; mimeType: string; dataBase64: string }> {
  const userId = await requireUserId();

  const [row] = await db
    .select()
    .from(spaceFiles)
    .where(and(eq(spaceFiles.id, fileId), isNull(spaceFiles.deletedAt)))
    .limit(1);

  if (!row) {
    throw new Error("File not found");
  }

  await requireSpaceAccess(row.spaceId, userId, "viewer");

  return {
    name: row.name,
    mimeType: row.mimeType,
    dataBase64: row.dataBase64,
  };
}

export async function toggleSpaceFileFavorite(
  fileId: number,
): Promise<SpaceFileListItem> {
  const userId = await requireUserId();

  const [current] = await db
    .select()
    .from(spaceFiles)
    .where(eq(spaceFiles.id, fileId))
    .limit(1);

  if (!current) {
    throw new Error("File not found");
  }

  const role = await requireSpaceAccess(current.spaceId, userId, "editor");

  const [row] = await db
    .update(spaceFiles)
    .set({ isFavorite: !current.isFavorite, updatedAt: sql`now()` })
    .where(eq(spaceFiles.id, fileId))
    .returning();

  const initials = await resolveInitialsForClerkIds([row.clerkId]);
  return toFileListItem(row, role, initials.get(row.clerkId) ?? "??");
}

export async function moveSpaceFile(
  fileId: number,
  targetSpaceId: number,
): Promise<SpaceFileListItem> {
  const userId = await requireUserId();

  const [current] = await db
    .select()
    .from(spaceFiles)
    .where(eq(spaceFiles.id, fileId))
    .limit(1);

  if (!current) {
    throw new Error("File not found");
  }

  await requireSpaceAccess(current.spaceId, userId, "editor");
  const role = await requireSpaceAccess(targetSpaceId, userId, "editor");

  const [row] = await db
    .update(spaceFiles)
    .set({ spaceId: targetSpaceId, updatedAt: sql`now()` })
    .where(eq(spaceFiles.id, fileId))
    .returning();

  const initials = await resolveInitialsForClerkIds([row.clerkId]);
  return toFileListItem(row, role, initials.get(row.clerkId) ?? "??");
}

export async function renameSpaceFile(
  fileId: number,
  name: string,
): Promise<SpaceFileListItem> {
  const userId = await requireUserId();

  const [current] = await db
    .select()
    .from(spaceFiles)
    .where(eq(spaceFiles.id, fileId))
    .limit(1);

  if (!current) {
    throw new Error("File not found");
  }

  const role = await requireSpaceAccess(current.spaceId, userId, "editor");

  const [row] = await db
    .update(spaceFiles)
    .set({ name: name.trim() || "Untitled file", updatedAt: sql`now()` })
    .where(eq(spaceFiles.id, fileId))
    .returning();

  const initials = await resolveInitialsForClerkIds([row.clerkId]);
  return toFileListItem(row, role, initials.get(row.clerkId) ?? "??");
}

export async function archiveSpaceFile(fileId: number): Promise<SpaceFileListItem> {
  const userId = await requireUserId();

  const [current] = await db
    .select()
    .from(spaceFiles)
    .where(eq(spaceFiles.id, fileId))
    .limit(1);

  if (!current) {
    throw new Error("File not found");
  }

  const role = await requireSpaceAccess(current.spaceId, userId, "editor");

  const [row] = await db
    .update(spaceFiles)
    .set({ archivedAt: sql`now()`, updatedAt: sql`now()` })
    .where(eq(spaceFiles.id, fileId))
    .returning();

  const initials = await resolveInitialsForClerkIds([row.clerkId]);
  return toFileListItem(row, role, initials.get(row.clerkId) ?? "??");
}

export async function softDeleteSpaceFile(fileId: number): Promise<void> {
  const userId = await requireUserId();

  const [file] = await db
    .select()
    .from(spaceFiles)
    .where(eq(spaceFiles.id, fileId))
    .limit(1);

  if (!file) {
    throw new Error("File not found");
  }

  const role = await getSpaceRole(file.spaceId, userId);
  if (role !== "owner" && file.clerkId !== userId) {
    throw new Error("Insufficient permissions");
  }

  await requireSpaceAccess(file.spaceId, userId, "editor");

  await db
    .update(spaceFiles)
    .set({ deletedAt: sql`now()`, updatedAt: sql`now()` })
    .where(eq(spaceFiles.id, fileId));
}
