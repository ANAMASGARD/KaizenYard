"use server";

import { auth } from "@clerk/nextjs/server";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db, kanbanBoardCollaborators, kanbanBoards, users } from "@/db";
import { requireBoardOwnership } from "@/lib/kanban/access";
import { isCollaboratorRole, type CollaboratorRole } from "@/lib/kanban/room";
import { maskEmail } from "@/lib/mask-email";

export type CollaboratorRecord = {
  id: number;
  boardId: number;
  email: string;
  clerkId: string | null;
  role: CollaboratorRole;
  invitedByClerkId: string;
  acceptedAt: string | null;
  displayName: string | null;
  displayEmail: string;
  isPending: boolean;
};

export type BoardCollaboratorsData = {
  ownerClerkId: string;
  ownerName: string | null;
  ownerEmail: string;
  collaborators: CollaboratorRecord[];
};

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function toCollaboratorRecord(
  row: typeof kanbanBoardCollaborators.$inferSelect,
  userByClerkId: Map<string, { name: string | null; email: string }>,
): CollaboratorRecord {
  const user = row.clerkId ? userByClerkId.get(row.clerkId) : undefined;
  return {
    id: row.id,
    boardId: row.boardId,
    email: row.email,
    clerkId: row.clerkId,
    role: isCollaboratorRole(row.role) ? row.role : "editor",
    invitedByClerkId: row.invitedByClerkId,
    acceptedAt: row.acceptedAt ? row.acceptedAt.toISOString() : null,
    displayName: user?.name ?? null,
    displayEmail: maskEmail(row.email),
    isPending: row.acceptedAt === null,
  };
}

async function requireUserId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }
  return userId;
}

export async function listBoardCollaborators(
  boardId: number,
): Promise<BoardCollaboratorsData> {
  const userId = await requireUserId();
  await requireBoardOwnership(boardId, userId);

  const [board] = await db
    .select()
    .from(kanbanBoards)
    .where(eq(kanbanBoards.id, boardId))
    .limit(1);

  if (!board) {
    throw new Error("Board not found");
  }

  const [owner] = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, board.clerkId))
    .limit(1);

  const rows = await db
    .select()
    .from(kanbanBoardCollaborators)
    .where(eq(kanbanBoardCollaborators.boardId, boardId))
    .orderBy(kanbanBoardCollaborators.createdAt);

  const clerkIds = rows
    .map((row) => row.clerkId)
    .filter((id): id is string => Boolean(id));

  const userRows =
    clerkIds.length > 0
      ? await db.select().from(users).where(inArray(users.clerkId, clerkIds))
      : [];

  const userByClerkId = new Map(
    userRows.map((user) => [user.clerkId, { name: user.name, email: user.email }]),
  );

  return {
    ownerClerkId: board.clerkId,
    ownerName: owner?.name ?? null,
    ownerEmail: owner ? maskEmail(owner.email) : "••••••@••••",
    collaborators: rows.map((row) => toCollaboratorRecord(row, userByClerkId)),
  };
}

export async function inviteCollaborator(
  boardId: number,
  email: string,
  role: CollaboratorRole,
): Promise<CollaboratorRecord> {
  const userId = await requireUserId();
  await requireBoardOwnership(boardId, userId);

  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail || !normalizedEmail.includes("@")) {
    throw new Error("Valid email is required");
  }
  if (!isCollaboratorRole(role)) {
    throw new Error("Invalid role");
  }

  const [board] = await db
    .select()
    .from(kanbanBoards)
    .where(eq(kanbanBoards.id, boardId))
    .limit(1);

  if (!board) {
    throw new Error("Board not found");
  }

  const [owner] = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, board.clerkId))
    .limit(1);

  if (owner?.email.toLowerCase() === normalizedEmail) {
    throw new Error("Cannot invite the board owner");
  }

  const [existing] = await db
    .select()
    .from(kanbanBoardCollaborators)
    .where(
      and(
        eq(kanbanBoardCollaborators.boardId, boardId),
        eq(kanbanBoardCollaborators.email, normalizedEmail),
      ),
    )
    .limit(1);

  if (existing) {
    throw new Error("This email already has access");
  }

  const [matchedUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1);

  const [row] = await db
    .insert(kanbanBoardCollaborators)
    .values({
      boardId,
      email: normalizedEmail,
      clerkId: matchedUser?.clerkId ?? null,
      role,
      invitedByClerkId: userId,
      acceptedAt: matchedUser ? new Date() : null,
    })
    .returning();

  const userByClerkId = new Map<string, { name: string | null; email: string }>();
  if (matchedUser) {
    userByClerkId.set(matchedUser.clerkId, {
      name: matchedUser.name,
      email: matchedUser.email,
    });
  }

  return toCollaboratorRecord(row, userByClerkId);
}

export async function updateCollaboratorRole(
  collaboratorId: number,
  role: CollaboratorRole,
): Promise<CollaboratorRecord> {
  const userId = await requireUserId();
  if (!isCollaboratorRole(role)) {
    throw new Error("Invalid role");
  }

  const [existing] = await db
    .select()
    .from(kanbanBoardCollaborators)
    .where(eq(kanbanBoardCollaborators.id, collaboratorId))
    .limit(1);

  if (!existing) {
    throw new Error("Collaborator not found");
  }

  await requireBoardOwnership(existing.boardId, userId);

  const [row] = await db
    .update(kanbanBoardCollaborators)
    .set({ role, updatedAt: sql`now()` })
    .where(eq(kanbanBoardCollaborators.id, collaboratorId))
    .returning();

  const userByClerkId = new Map<string, { name: string | null; email: string }>();
  if (row.clerkId) {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, row.clerkId))
      .limit(1);
    if (user) {
      userByClerkId.set(user.clerkId, { name: user.name, email: user.email });
    }
  }

  return toCollaboratorRecord(row, userByClerkId);
}

export async function removeCollaborator(collaboratorId: number): Promise<void> {
  const userId = await requireUserId();

  const [existing] = await db
    .select()
    .from(kanbanBoardCollaborators)
    .where(eq(kanbanBoardCollaborators.id, collaboratorId))
    .limit(1);

  if (!existing) {
    throw new Error("Collaborator not found");
  }

  await requireBoardOwnership(existing.boardId, userId);

  await db
    .delete(kanbanBoardCollaborators)
    .where(eq(kanbanBoardCollaborators.id, collaboratorId));
}

export async function resolvePendingInvites(
  clerkId: string,
  email: string,
): Promise<void> {
  const normalizedEmail = normalizeEmail(email);
  await db
    .update(kanbanBoardCollaborators)
    .set({
      clerkId,
      acceptedAt: sql`now()`,
      updatedAt: sql`now()`,
    })
    .where(
      and(
        eq(kanbanBoardCollaborators.email, normalizedEmail),
        sql`${kanbanBoardCollaborators.acceptedAt} IS NULL`,
      ),
    );
}
