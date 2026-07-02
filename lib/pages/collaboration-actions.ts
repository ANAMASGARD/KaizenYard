"use server";

import { auth } from "@clerk/nextjs/server";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db, spaceCollaborators, spaces, users } from "@/db";
import { normalizeEmail } from "@/lib/collaboration/email";
import { toCollaboratorDisplayRecord } from "@/lib/collaboration/format-collaborator";
import type {
  CollaboratorDisplayRecord,
  CollaboratorsPanelData,
} from "@/lib/collaboration/types";
import {
  requireSpaceAccess,
  requireSpaceOwnership,
} from "@/lib/pages/access";
import { isCollaboratorRole, type CollaboratorRole } from "@/lib/pages/room";
import { maskEmail } from "@/lib/mask-email";

export type SpaceCollaboratorRecord = CollaboratorDisplayRecord & {
  spaceId: number;
};
export type SpaceCollaboratorsData = CollaboratorsPanelData;

async function requireUserId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }
  return userId;
}

export async function listSpaceCollaborators(
  spaceId: number,
): Promise<SpaceCollaboratorsData> {
  const userId = await requireUserId();
  await requireSpaceAccess(spaceId, userId, "viewer");

  const [space] = await db
    .select()
    .from(spaces)
    .where(eq(spaces.id, spaceId))
    .limit(1);

  if (!space) {
    throw new Error("Space not found");
  }

  const [owner] = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, space.clerkId))
    .limit(1);

  const rows = await db
    .select()
    .from(spaceCollaborators)
    .where(eq(spaceCollaborators.spaceId, spaceId))
    .orderBy(spaceCollaborators.createdAt);

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
    ownerClerkId: space.clerkId,
    ownerName: owner?.name ?? null,
    ownerEmail: owner ? maskEmail(owner.email) : "••••••@••••",
    collaborators: rows.map((row) =>
      toCollaboratorDisplayRecord(row, userByClerkId),
    ),
  };
}

function toCollaboratorRecord(
  row: typeof spaceCollaborators.$inferSelect,
  userByClerkId: Map<string, { name: string | null; email: string }>,
): SpaceCollaboratorRecord {
  return {
    spaceId: row.spaceId,
    ...toCollaboratorDisplayRecord(row, userByClerkId),
  };
}

export async function inviteSpaceCollaborator(
  spaceId: number,
  email: string,
  role: CollaboratorRole,
): Promise<SpaceCollaboratorRecord> {
  const userId = await requireUserId();
  await requireSpaceOwnership(spaceId, userId);

  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail || !normalizedEmail.includes("@")) {
    throw new Error("Valid email is required");
  }
  if (!isCollaboratorRole(role)) {
    throw new Error("Invalid role");
  }

  const [space] = await db
    .select()
    .from(spaces)
    .where(eq(spaces.id, spaceId))
    .limit(1);

  if (!space) {
    throw new Error("Space not found");
  }

  if (space.isVault) {
    throw new Error("Secure vaults cannot be shared yet");
  }

  const [owner] = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, space.clerkId))
    .limit(1);

  if (owner?.email.toLowerCase() === normalizedEmail) {
    throw new Error("Cannot invite the space owner");
  }

  const [existing] = await db
    .select()
    .from(spaceCollaborators)
    .where(
      and(
        eq(spaceCollaborators.spaceId, spaceId),
        eq(spaceCollaborators.email, normalizedEmail),
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
    .insert(spaceCollaborators)
    .values({
      spaceId,
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

export async function updateSpaceCollaboratorRole(
  collaboratorId: number,
  role: CollaboratorRole,
): Promise<SpaceCollaboratorRecord> {
  const userId = await requireUserId();
  if (!isCollaboratorRole(role)) {
    throw new Error("Invalid role");
  }

  const [existing] = await db
    .select()
    .from(spaceCollaborators)
    .where(eq(spaceCollaborators.id, collaboratorId))
    .limit(1);

  if (!existing) {
    throw new Error("Collaborator not found");
  }

  await requireSpaceOwnership(existing.spaceId, userId);

  const [row] = await db
    .update(spaceCollaborators)
    .set({ role, updatedAt: sql`now()` })
    .where(eq(spaceCollaborators.id, collaboratorId))
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

export async function removeSpaceCollaborator(
  collaboratorId: number,
): Promise<void> {
  const userId = await requireUserId();

  const [existing] = await db
    .select()
    .from(spaceCollaborators)
    .where(eq(spaceCollaborators.id, collaboratorId))
    .limit(1);

  if (!existing) {
    throw new Error("Collaborator not found");
  }

  await requireSpaceOwnership(existing.spaceId, userId);

  await db
    .delete(spaceCollaborators)
    .where(eq(spaceCollaborators.id, collaboratorId));
}

export async function resolvePendingSpaceInvites(
  clerkId: string,
  email: string,
): Promise<void> {
  const normalizedEmail = normalizeEmail(email);
  await db
    .update(spaceCollaborators)
    .set({
      clerkId,
      acceptedAt: sql`now()`,
      updatedAt: sql`now()`,
    })
    .where(
      and(
        eq(spaceCollaborators.email, normalizedEmail),
        sql`${spaceCollaborators.acceptedAt} IS NULL`,
      ),
    );
}
