"use server";

import { auth } from "@clerk/nextjs/server";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db, generatedAppCollaborators, generatedApps, users } from "@/db";
import { normalizeEmail } from "@/lib/collaboration/email";
import { toCollaboratorDisplayRecord } from "@/lib/collaboration/format-collaborator";
import type {
  CollaboratorDisplayRecord,
  CollaboratorsPanelData,
  CollaboratorRole,
} from "@/lib/collaboration/types";
import { isCollaboratorRole } from "@/lib/collaboration/types";
import { requireGeneratedAppAccess, requireGeneratedAppOwnership } from "@/lib/templates/access";
import { maskEmail } from "@/lib/mask-email";

export type GeneratedAppCollaboratorRecord = CollaboratorDisplayRecord & {
  appId: number;
};

async function requireUserId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }
  return userId;
}

function toRecord(
  row: typeof generatedAppCollaborators.$inferSelect,
  userByClerkId: Map<string, { name: string | null; email: string }>,
): GeneratedAppCollaboratorRecord {
  return {
    appId: row.appId,
    ...toCollaboratorDisplayRecord(row, userByClerkId),
  };
}

export async function listGeneratedAppCollaborators(
  appId: number,
): Promise<CollaboratorsPanelData> {
  const userId = await requireUserId();
  await requireGeneratedAppAccess(appId, userId, "viewer");

  const [app] = await db
    .select()
    .from(generatedApps)
    .where(eq(generatedApps.id, appId))
    .limit(1);

  if (!app) {
    throw new Error("App not found");
  }

  const [owner] = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, app.clerkId))
    .limit(1);

  const rows = await db
    .select()
    .from(generatedAppCollaborators)
    .where(eq(generatedAppCollaborators.appId, appId))
    .orderBy(generatedAppCollaborators.createdAt);

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
    ownerClerkId: app.clerkId,
    ownerName: owner?.name ?? null,
    ownerEmail: owner ? maskEmail(owner.email) : "••••••@••••",
    collaborators: rows.map((row) => toCollaboratorDisplayRecord(row, userByClerkId)),
  };
}

export async function inviteGeneratedAppCollaborator(
  appId: number,
  email: string,
  role: CollaboratorRole,
): Promise<GeneratedAppCollaboratorRecord> {
  const userId = await requireUserId();
  await requireGeneratedAppOwnership(appId, userId);

  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail || !normalizedEmail.includes("@")) {
    throw new Error("Valid email is required");
  }
  if (!isCollaboratorRole(role)) {
    throw new Error("Invalid role");
  }

  const [app] = await db
    .select()
    .from(generatedApps)
    .where(eq(generatedApps.id, appId))
    .limit(1);

  if (!app) {
    throw new Error("App not found");
  }

  const [owner] = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, app.clerkId))
    .limit(1);

  if (owner?.email.toLowerCase() === normalizedEmail) {
    throw new Error("Cannot invite the app owner");
  }

  const [existing] = await db
    .select()
    .from(generatedAppCollaborators)
    .where(
      and(
        eq(generatedAppCollaborators.appId, appId),
        eq(generatedAppCollaborators.email, normalizedEmail),
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
    .insert(generatedAppCollaborators)
    .values({
      appId,
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

  return toRecord(row, userByClerkId);
}

export async function updateGeneratedAppCollaboratorRole(
  collaboratorId: number,
  role: CollaboratorRole,
): Promise<GeneratedAppCollaboratorRecord> {
  const userId = await requireUserId();
  if (!isCollaboratorRole(role)) {
    throw new Error("Invalid role");
  }

  const [existing] = await db
    .select()
    .from(generatedAppCollaborators)
    .where(eq(generatedAppCollaborators.id, collaboratorId))
    .limit(1);

  if (!existing) {
    throw new Error("Collaborator not found");
  }

  await requireGeneratedAppOwnership(existing.appId, userId);

  const [row] = await db
    .update(generatedAppCollaborators)
    .set({ role, updatedAt: sql`now()` })
    .where(eq(generatedAppCollaborators.id, collaboratorId))
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

  return toRecord(row, userByClerkId);
}

export async function removeGeneratedAppCollaborator(
  collaboratorId: number,
): Promise<void> {
  const userId = await requireUserId();

  const [existing] = await db
    .select()
    .from(generatedAppCollaborators)
    .where(eq(generatedAppCollaborators.id, collaboratorId))
    .limit(1);

  if (!existing) {
    throw new Error("Collaborator not found");
  }

  await requireGeneratedAppOwnership(existing.appId, userId);

  await db
    .delete(generatedAppCollaborators)
    .where(eq(generatedAppCollaborators.id, collaboratorId));
}

export async function resolvePendingGeneratedAppInvites(
  clerkId: string,
  email: string,
): Promise<void> {
  const normalizedEmail = normalizeEmail(email);
  await db
    .update(generatedAppCollaborators)
    .set({
      clerkId,
      acceptedAt: sql`now()`,
      updatedAt: sql`now()`,
    })
    .where(
      and(
        eq(generatedAppCollaborators.email, normalizedEmail),
        sql`${generatedAppCollaborators.acceptedAt} IS NULL`,
      ),
    );
}
