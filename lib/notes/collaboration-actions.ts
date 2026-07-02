"use server";

import { auth } from "@clerk/nextjs/server";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db, noteCollaborators, notes, users } from "@/db";
import { normalizeEmail } from "@/lib/collaboration/email";
import { toCollaboratorDisplayRecord } from "@/lib/collaboration/format-collaborator";
import type {
  CollaboratorDisplayRecord,
  CollaboratorsPanelData,
} from "@/lib/collaboration/types";
import { requireNoteAccess, requireNoteOwnership } from "@/lib/notes/access";
import { isCollaboratorRole, type CollaboratorRole } from "@/lib/notes/room";
import { maskEmail } from "@/lib/mask-email";

export type CollaboratorRecord = CollaboratorDisplayRecord & { noteId: number };
export type NoteCollaboratorsData = CollaboratorsPanelData;

async function requireUserId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }
  return userId;
}

export async function listNoteCollaborators(
  noteId: number,
): Promise<NoteCollaboratorsData> {
  const userId = await requireUserId();
  await requireNoteAccess(noteId, userId, "viewer");

  const [note] = await db
    .select()
    .from(notes)
    .where(eq(notes.id, noteId))
    .limit(1);

  if (!note) {
    throw new Error("Note not found");
  }

  const [owner] = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, note.clerkId))
    .limit(1);

  const rows = await db
    .select()
    .from(noteCollaborators)
    .where(eq(noteCollaborators.noteId, noteId))
    .orderBy(noteCollaborators.createdAt);

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
    ownerClerkId: note.clerkId,
    ownerName: owner?.name ?? null,
    ownerEmail: owner ? maskEmail(owner.email) : "••••••@••••",
    collaborators: rows.map((row) => toCollaboratorDisplayRecord(row, userByClerkId)),
  };
}

function toCollaboratorRecord(
  row: typeof noteCollaborators.$inferSelect,
  userByClerkId: Map<string, { name: string | null; email: string }>,
): CollaboratorRecord {
  return {
    noteId: row.noteId,
    ...toCollaboratorDisplayRecord(row, userByClerkId),
  };
}

export async function inviteNoteCollaborator(
  noteId: number,
  email: string,
  role: CollaboratorRole,
): Promise<CollaboratorRecord> {
  const userId = await requireUserId();
  await requireNoteOwnership(noteId, userId);

  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail || !normalizedEmail.includes("@")) {
    throw new Error("Valid email is required");
  }
  if (!isCollaboratorRole(role)) {
    throw new Error("Invalid role");
  }

  const [note] = await db
    .select()
    .from(notes)
    .where(eq(notes.id, noteId))
    .limit(1);

  if (!note) {
    throw new Error("Note not found");
  }

  const [owner] = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, note.clerkId))
    .limit(1);

  if (owner?.email.toLowerCase() === normalizedEmail) {
    throw new Error("Cannot invite the note owner");
  }

  const [existing] = await db
    .select()
    .from(noteCollaborators)
    .where(
      and(
        eq(noteCollaborators.noteId, noteId),
        eq(noteCollaborators.email, normalizedEmail),
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
    .insert(noteCollaborators)
    .values({
      noteId,
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

export async function updateNoteCollaboratorRole(
  collaboratorId: number,
  role: CollaboratorRole,
): Promise<CollaboratorRecord> {
  const userId = await requireUserId();
  if (!isCollaboratorRole(role)) {
    throw new Error("Invalid role");
  }

  const [existing] = await db
    .select()
    .from(noteCollaborators)
    .where(eq(noteCollaborators.id, collaboratorId))
    .limit(1);

  if (!existing) {
    throw new Error("Collaborator not found");
  }

  await requireNoteOwnership(existing.noteId, userId);

  const [row] = await db
    .update(noteCollaborators)
    .set({ role, updatedAt: sql`now()` })
    .where(eq(noteCollaborators.id, collaboratorId))
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

export async function removeNoteCollaborator(collaboratorId: number): Promise<void> {
  const userId = await requireUserId();

  const [existing] = await db
    .select()
    .from(noteCollaborators)
    .where(eq(noteCollaborators.id, collaboratorId))
    .limit(1);

  if (!existing) {
    throw new Error("Collaborator not found");
  }

  await requireNoteOwnership(existing.noteId, userId);

  await db
    .delete(noteCollaborators)
    .where(eq(noteCollaborators.id, collaboratorId));
}

export async function resolvePendingNoteInvites(
  clerkId: string,
  email: string,
): Promise<void> {
  const normalizedEmail = normalizeEmail(email);
  await db
    .update(noteCollaborators)
    .set({
      clerkId,
      acceptedAt: sql`now()`,
      updatedAt: sql`now()`,
    })
    .where(
      and(
        eq(noteCollaborators.email, normalizedEmail),
        sql`${noteCollaborators.acceptedAt} IS NULL`,
      ),
    );
}
