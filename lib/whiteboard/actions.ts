"use server";

import { auth } from "@clerk/nextjs/server";
import {
  and,
  eq,
  ilike,
  isNotNull,
  isNull,
  sql,
} from "drizzle-orm";
import { db, whiteboardCollaborators, whiteboards } from "@/db";
import {
  getWhiteboardRole,
  requireWhiteboardAccess,
  requireWhiteboardOwnership,
} from "@/lib/whiteboard/access";
import { whiteboardRowToListItem } from "@/lib/whiteboard/mappers";
import { EMPTY_WHITEBOARD_SCENE } from "@/lib/whiteboard/persistence";
import { parseWhiteboardScene } from "@/lib/whiteboard/scene";
import type { WhiteboardRole } from "@/lib/whiteboard/room";
import { isKanbanColor, type KanbanColor } from "@/lib/kanban/colors";
import type {
  CreateWhiteboardInput,
  UpdateWhiteboardInput,
  WhiteboardListItem,
  WhiteboardRecord,
} from "@/lib/whiteboard/types";

async function requireUserId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }
  return userId;
}

function toWhiteboardRecord(
  row: typeof whiteboards.$inferSelect,
  role: WhiteboardRole,
): WhiteboardRecord {
  return {
    id: row.id,
    clerkId: row.clerkId,
    title: row.title,
    color: isKanbanColor(row.color) ? row.color : "yellow",
    content: parseWhiteboardScene(row.content),
    pinned: row.pinned,
    deletedAt: row.deletedAt ? row.deletedAt.toISOString() : null,
    sortOrder: row.sortOrder,
    role,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

async function resolveRoleForWhiteboard(
  whiteboardId: number,
  clerkId: string,
  ownerClerkId: string,
): Promise<WhiteboardRole | null> {
  if (ownerClerkId === clerkId) return "owner";
  return getWhiteboardRole(whiteboardId, clerkId);
}

export async function listWhiteboards(options?: {
  trash?: boolean;
  query?: string;
}): Promise<WhiteboardListItem[]> {
  const userId = await requireUserId();
  const trash = options?.trash ?? false;
  const query = options?.query?.trim();

  const owned = await db
    .select()
    .from(whiteboards)
    .where(
      and(
        eq(whiteboards.clerkId, userId),
        trash ? isNotNull(whiteboards.deletedAt) : isNull(whiteboards.deletedAt),
        query ? ilike(whiteboards.title, `%${query}%`) : undefined,
      ),
    );

  const collabRows = await db
    .select({
      whiteboard: whiteboards,
      role: whiteboardCollaborators.role,
    })
    .from(whiteboardCollaborators)
    .innerJoin(
      whiteboards,
      eq(whiteboardCollaborators.whiteboardId, whiteboards.id),
    )
    .where(
      and(
        eq(whiteboardCollaborators.clerkId, userId),
        isNotNull(whiteboardCollaborators.acceptedAt),
        trash ? isNotNull(whiteboards.deletedAt) : isNull(whiteboards.deletedAt),
        query ? ilike(whiteboards.title, `%${query}%`) : undefined,
      ),
    );

  const items: WhiteboardListItem[] = [];
  const seen = new Set<number>();

  for (const row of owned) {
    seen.add(row.id);
    items.push(whiteboardRowToListItem(row, "owner"));
  }

  for (const { whiteboard, role } of collabRows) {
    if (seen.has(whiteboard.id)) continue;
    seen.add(whiteboard.id);
    const whiteboardRole: WhiteboardRole =
      role === "viewer" ? "viewer" : "editor";
    items.push(whiteboardRowToListItem(whiteboard, whiteboardRole));
  }

  items.sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  return items;
}

export async function getWhiteboard(
  whiteboardId: number,
): Promise<WhiteboardRecord | null> {
  const userId = await requireUserId();

  const [row] = await db
    .select()
    .from(whiteboards)
    .where(eq(whiteboards.id, whiteboardId))
    .limit(1);

  if (!row) return null;

  const role = await resolveRoleForWhiteboard(whiteboardId, userId, row.clerkId);
  if (!role) return null;

  return toWhiteboardRecord(row, role);
}

export async function createWhiteboard(
  input?: CreateWhiteboardInput,
): Promise<WhiteboardRecord> {
  const userId = await requireUserId();

  const color =
    input?.color && isKanbanColor(input.color) ? input.color : "yellow";

  const [maxOrder] = await db
    .select({
      max: sql<number>`coalesce(max(${whiteboards.sortOrder}), -1)`,
    })
    .from(whiteboards)
    .where(
      and(eq(whiteboards.clerkId, userId), isNull(whiteboards.deletedAt)),
    );

  const [row] = await db
    .insert(whiteboards)
    .values({
      clerkId: userId,
      title: input?.title?.trim() || "Untitled",
      color,
      content: input?.content ?? EMPTY_WHITEBOARD_SCENE,
      sortOrder: (maxOrder?.max ?? -1) + 1,
    })
    .returning();

  return toWhiteboardRecord(row, "owner");
}

export async function updateWhiteboard(
  whiteboardId: number,
  input: UpdateWhiteboardInput,
): Promise<WhiteboardRecord> {
  const userId = await requireUserId();
  const role = await requireWhiteboardAccess(whiteboardId, userId, "editor");

  const [row] = await db
    .update(whiteboards)
    .set({
      ...(input.title !== undefined
        ? { title: input.title.trim() || "Untitled" }
        : {}),
      ...(input.color !== undefined && isKanbanColor(input.color)
        ? { color: input.color }
        : {}),
      ...(input.content !== undefined ? { content: input.content } : {}),
      ...(input.pinned !== undefined ? { pinned: input.pinned } : {}),
      updatedAt: sql`now()`,
    })
    .where(eq(whiteboards.id, whiteboardId))
    .returning();

  if (!row) {
    throw new Error("Whiteboard not found");
  }

  return toWhiteboardRecord(row, role);
}

export async function duplicateWhiteboard(
  whiteboardId: number,
): Promise<WhiteboardRecord> {
  const userId = await requireUserId();
  await requireWhiteboardAccess(whiteboardId, userId, "viewer");

  const [source] = await db
    .select()
    .from(whiteboards)
    .where(eq(whiteboards.id, whiteboardId))
    .limit(1);

  if (!source) {
    throw new Error("Whiteboard not found");
  }

  return createWhiteboard({
    title: `${source.title} (copy)`,
    color: isKanbanColor(source.color) ? source.color : "yellow",
    content: parseWhiteboardScene(source.content),
  });
}

export async function togglePinWhiteboard(
  whiteboardId: number,
): Promise<WhiteboardRecord> {
  const userId = await requireUserId();
  const role = await requireWhiteboardAccess(whiteboardId, userId, "editor");

  const [current] = await db
    .select()
    .from(whiteboards)
    .where(eq(whiteboards.id, whiteboardId))
    .limit(1);

  if (!current) {
    throw new Error("Whiteboard not found");
  }

  const [row] = await db
    .update(whiteboards)
    .set({ pinned: !current.pinned, updatedAt: sql`now()` })
    .where(eq(whiteboards.id, whiteboardId))
    .returning();

  return toWhiteboardRecord(row, role);
}

export async function setWhiteboardColor(
  whiteboardId: number,
  color: KanbanColor,
): Promise<WhiteboardRecord> {
  if (!isKanbanColor(color)) {
    throw new Error("Invalid color");
  }
  return updateWhiteboard(whiteboardId, { color });
}

export async function softDeleteWhiteboard(whiteboardId: number): Promise<void> {
  const userId = await requireUserId();
  await requireWhiteboardOwnership(whiteboardId, userId);

  await db
    .update(whiteboards)
    .set({ deletedAt: sql`now()`, updatedAt: sql`now()` })
    .where(eq(whiteboards.id, whiteboardId));
}

export async function restoreWhiteboard(
  whiteboardId: number,
): Promise<WhiteboardRecord> {
  const userId = await requireUserId();
  await requireWhiteboardOwnership(whiteboardId, userId);

  const [row] = await db
    .update(whiteboards)
    .set({ deletedAt: null, updatedAt: sql`now()` })
    .where(eq(whiteboards.id, whiteboardId))
    .returning();

  if (!row) {
    throw new Error("Whiteboard not found");
  }

  return toWhiteboardRecord(row, "owner");
}

export async function permanentDeleteWhiteboard(
  whiteboardId: number,
): Promise<void> {
  const userId = await requireUserId();
  await requireWhiteboardOwnership(whiteboardId, userId);

  await db.delete(whiteboards).where(eq(whiteboards.id, whiteboardId));
}

export async function emptyWhiteboardTrash(): Promise<number> {
  const userId = await requireUserId();

  const trashed = await db
    .select({ id: whiteboards.id })
    .from(whiteboards)
    .where(
      and(eq(whiteboards.clerkId, userId), isNotNull(whiteboards.deletedAt)),
    );

  if (trashed.length === 0) return 0;

  await db.delete(whiteboards).where(
    and(eq(whiteboards.clerkId, userId), isNotNull(whiteboards.deletedAt)),
  );

  return trashed.length;
}
