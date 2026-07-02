"use server";

import { auth } from "@clerk/nextjs/server";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db, users, whiteboardCollaborators, whiteboards } from "@/db";
import { normalizeEmail } from "@/lib/collaboration/email";
import { toCollaboratorDisplayRecord } from "@/lib/collaboration/format-collaborator";
import type {
  CollaboratorDisplayRecord,
  CollaboratorsPanelData,
} from "@/lib/collaboration/types";
import {
  requireWhiteboardAccess,
  requireWhiteboardOwnership,
} from "@/lib/whiteboard/access";
import {
  isCollaboratorRole,
  type CollaboratorRole,
} from "@/lib/whiteboard/room";
import { maskEmail } from "@/lib/mask-email";

export type WhiteboardCollaboratorRecord = CollaboratorDisplayRecord & {
  whiteboardId: number;
};
export type WhiteboardCollaboratorsData = CollaboratorsPanelData;

async function requireUserId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }
  return userId;
}

export async function listWhiteboardCollaborators(
  whiteboardId: number,
): Promise<WhiteboardCollaboratorsData> {
  const userId = await requireUserId();
  await requireWhiteboardAccess(whiteboardId, userId, "viewer");

  const [whiteboard] = await db
    .select()
    .from(whiteboards)
    .where(eq(whiteboards.id, whiteboardId))
    .limit(1);

  if (!whiteboard) {
    throw new Error("Whiteboard not found");
  }

  const [owner] = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, whiteboard.clerkId))
    .limit(1);

  const rows = await db
    .select()
    .from(whiteboardCollaborators)
    .where(eq(whiteboardCollaborators.whiteboardId, whiteboardId))
    .orderBy(whiteboardCollaborators.createdAt);

  const clerkIds = rows
    .map((row) => row.clerkId)
    .filter((id): id is string => Boolean(id));

  const userRows =
    clerkIds.length > 0
      ? await db.select().from(users).where(inArray(users.clerkId, clerkIds))
      : [];

  const userByClerkId = new Map(
    userRows.map((user) => [
      user.clerkId,
      { name: user.name, email: user.email },
    ]),
  );

  return {
    ownerClerkId: whiteboard.clerkId,
    ownerName: owner?.name ?? null,
    ownerEmail: owner ? maskEmail(owner.email) : "••••••@••••",
    collaborators: rows.map((row) =>
      toCollaboratorDisplayRecord(row, userByClerkId),
    ),
  };
}

function toWhiteboardCollaboratorRecord(
  row: typeof whiteboardCollaborators.$inferSelect,
  userByClerkId: Map<string, { name: string | null; email: string }>,
): WhiteboardCollaboratorRecord {
  return {
    whiteboardId: row.whiteboardId,
    ...toCollaboratorDisplayRecord(row, userByClerkId),
  };
}

export async function inviteWhiteboardCollaborator(
  whiteboardId: number,
  email: string,
  role: CollaboratorRole,
): Promise<WhiteboardCollaboratorRecord> {
  const userId = await requireUserId();
  await requireWhiteboardOwnership(whiteboardId, userId);

  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail || !normalizedEmail.includes("@")) {
    throw new Error("Valid email is required");
  }
  if (!isCollaboratorRole(role)) {
    throw new Error("Invalid role");
  }

  const [whiteboard] = await db
    .select()
    .from(whiteboards)
    .where(eq(whiteboards.id, whiteboardId))
    .limit(1);

  if (!whiteboard) {
    throw new Error("Whiteboard not found");
  }

  const [owner] = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, whiteboard.clerkId))
    .limit(1);

  if (owner?.email.toLowerCase() === normalizedEmail) {
    throw new Error("Cannot invite the whiteboard owner");
  }

  const [existing] = await db
    .select()
    .from(whiteboardCollaborators)
    .where(
      and(
        eq(whiteboardCollaborators.whiteboardId, whiteboardId),
        eq(whiteboardCollaborators.email, normalizedEmail),
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
    .insert(whiteboardCollaborators)
    .values({
      whiteboardId,
      email: normalizedEmail,
      clerkId: matchedUser?.clerkId ?? null,
      role,
      invitedByClerkId: userId,
      acceptedAt: matchedUser ? new Date() : null,
    })
    .returning();

  const userByClerkId = new Map<
    string,
    { name: string | null; email: string }
  >();
  if (matchedUser) {
    userByClerkId.set(matchedUser.clerkId, {
      name: matchedUser.name,
      email: matchedUser.email,
    });
  }

  return toWhiteboardCollaboratorRecord(row, userByClerkId);
}

export async function updateWhiteboardCollaboratorRole(
  collaboratorId: number,
  role: CollaboratorRole,
): Promise<WhiteboardCollaboratorRecord> {
  const userId = await requireUserId();
  if (!isCollaboratorRole(role)) {
    throw new Error("Invalid role");
  }

  const [existing] = await db
    .select()
    .from(whiteboardCollaborators)
    .where(eq(whiteboardCollaborators.id, collaboratorId))
    .limit(1);

  if (!existing) {
    throw new Error("Collaborator not found");
  }

  await requireWhiteboardOwnership(existing.whiteboardId, userId);

  const [row] = await db
    .update(whiteboardCollaborators)
    .set({ role, updatedAt: sql`now()` })
    .where(eq(whiteboardCollaborators.id, collaboratorId))
    .returning();

  const userByClerkId = new Map<
    string,
    { name: string | null; email: string }
  >();
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

  return toWhiteboardCollaboratorRecord(row, userByClerkId);
}

export async function removeWhiteboardCollaborator(
  collaboratorId: number,
): Promise<void> {
  const userId = await requireUserId();

  const [existing] = await db
    .select()
    .from(whiteboardCollaborators)
    .where(eq(whiteboardCollaborators.id, collaboratorId))
    .limit(1);

  if (!existing) {
    throw new Error("Collaborator not found");
  }

  await requireWhiteboardOwnership(existing.whiteboardId, userId);

  await db
    .delete(whiteboardCollaborators)
    .where(eq(whiteboardCollaborators.id, collaboratorId));
}

export async function resolvePendingWhiteboardInvites(
  clerkId: string,
  email: string,
): Promise<void> {
  const normalizedEmail = normalizeEmail(email);
  await db
    .update(whiteboardCollaborators)
    .set({
      clerkId,
      acceptedAt: sql`now()`,
      updatedAt: sql`now()`,
    })
    .where(
      and(
        eq(whiteboardCollaborators.email, normalizedEmail),
        sql`${whiteboardCollaborators.acceptedAt} IS NULL`,
      ),
    );
}
