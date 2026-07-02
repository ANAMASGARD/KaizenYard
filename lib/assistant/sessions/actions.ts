"use server";

import { randomUUID } from "node:crypto";
import { and, desc, eq } from "drizzle-orm";
import { assistantMessages, assistantSessions, db } from "@/db";
import type {
  AssistantMessageRecord,
  AssistantSessionRecord,
  PrivacyMode,
} from "@/lib/assistant/types";
import { requireUserId } from "@/lib/witness/require-user";

function toSessionRecord(row: typeof assistantSessions.$inferSelect): AssistantSessionRecord {
  return {
    id: row.id,
    clerkId: row.clerkId,
    title: row.title,
    privacyMode: row.privacyMode as PrivacyMode,
    agentSessionId: row.agentSessionId,
    delegateAddress: row.delegateAddress,
    witnessGroupId: row.witnessGroupId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    lastMessageAt: row.lastMessageAt?.toISOString() ?? null,
  };
}

function toMessageRecord(row: typeof assistantMessages.$inferSelect): AssistantMessageRecord {
  return {
    id: row.id,
    sessionId: row.sessionId,
    role: row.role,
    parts: row.parts,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function listAssistantSessions(): Promise<AssistantSessionRecord[]> {
  const userId = await requireUserId();
  const rows = await db
    .select()
    .from(assistantSessions)
    .where(eq(assistantSessions.clerkId, userId))
    .orderBy(desc(assistantSessions.lastMessageAt), desc(assistantSessions.updatedAt));
  return rows.map(toSessionRecord);
}

export async function createAssistantSession(input?: {
  title?: string;
  privacyMode?: PrivacyMode;
  witnessGroupId?: number;
}): Promise<AssistantSessionRecord> {
  const userId = await requireUserId();
  const [row] = await db
    .insert(assistantSessions)
    .values({
      clerkId: userId,
      title: input?.title ?? "New chat",
      privacyMode: input?.privacyMode ?? "standard",
      agentSessionId: randomUUID(),
      witnessGroupId: input?.witnessGroupId ?? null,
      lastMessageAt: new Date(),
    })
    .returning();
  return toSessionRecord(row);
}

export async function renameAssistantSession(
  sessionId: number,
  title: string,
): Promise<AssistantSessionRecord> {
  const userId = await requireUserId();
  const [row] = await db
    .update(assistantSessions)
    .set({ title: title.trim() || "New chat", updatedAt: new Date() })
    .where(and(eq(assistantSessions.id, sessionId), eq(assistantSessions.clerkId, userId)))
    .returning();
  if (!row) {
    throw new Error("Session not found");
  }
  return toSessionRecord(row);
}

export async function updateAssistantSessionMode(
  sessionId: number,
  privacyMode: PrivacyMode,
): Promise<AssistantSessionRecord> {
  const userId = await requireUserId();
  const [row] = await db
    .update(assistantSessions)
    .set({ privacyMode, updatedAt: new Date() })
    .where(and(eq(assistantSessions.id, sessionId), eq(assistantSessions.clerkId, userId)))
    .returning();
  if (!row) {
    throw new Error("Session not found");
  }
  return toSessionRecord(row);
}

export async function bindDelegateToSession(
  sessionId: number,
  delegateAddress: string,
): Promise<AssistantSessionRecord> {
  const userId = await requireUserId();
  const [row] = await db
    .update(assistantSessions)
    .set({ delegateAddress, privacyMode: "delegate", updatedAt: new Date() })
    .where(and(eq(assistantSessions.id, sessionId), eq(assistantSessions.clerkId, userId)))
    .returning();
  if (!row) {
    throw new Error("Session not found");
  }
  return toSessionRecord(row);
}

export async function deleteAssistantSession(sessionId: number): Promise<void> {
  const userId = await requireUserId();
  await db
    .delete(assistantSessions)
    .where(and(eq(assistantSessions.id, sessionId), eq(assistantSessions.clerkId, userId)));
}

export async function getAssistantSessionForUser(
  sessionId: number,
): Promise<AssistantSessionRecord | null> {
  const userId = await requireUserId();
  const [row] = await db
    .select()
    .from(assistantSessions)
    .where(and(eq(assistantSessions.id, sessionId), eq(assistantSessions.clerkId, userId)))
    .limit(1);
  return row ? toSessionRecord(row) : null;
}

export async function loadSessionMessages(sessionId: number): Promise<AssistantMessageRecord[]> {
  const session = await getAssistantSessionForUser(sessionId);
  if (!session) {
    throw new Error("Session not found");
  }
  const rows = await db
    .select()
    .from(assistantMessages)
    .where(eq(assistantMessages.sessionId, sessionId))
    .orderBy(assistantMessages.createdAt);
  return rows.map(toMessageRecord);
}

export async function appendSessionMessages(
  sessionId: number,
  messages: Array<{ role: string; parts: unknown }>,
): Promise<void> {
  const session = await getAssistantSessionForUser(sessionId);
  if (!session) {
    throw new Error("Session not found");
  }

  if (messages.length === 0) {
    return;
  }

  await db.insert(assistantMessages).values(
    messages.map((m) => ({
      sessionId,
      role: m.role,
      parts: m.parts,
    })),
  );

  const firstUser = messages.find((m) => m.role === "user");
  const updates: Partial<typeof assistantSessions.$inferInsert> = {
    lastMessageAt: new Date(),
    updatedAt: new Date(),
  };

  if (session.title === "New chat" && firstUser) {
    const textPart = Array.isArray(firstUser.parts)
      ? (firstUser.parts as Array<{ type?: string; text?: string }>).find((p) => p.type === "text")
      : null;
    const text = textPart?.text?.trim();
    if (text) {
      updates.title = text.length > 48 ? `${text.slice(0, 48)}…` : text;
    }
  }

  await db
    .update(assistantSessions)
    .set(updates)
    .where(eq(assistantSessions.id, sessionId));
}

export async function syncSessionMessagesFromChat(
  sessionId: number,
  finalMessages: Array<{ role: string; parts: unknown }>,
): Promise<void> {
  const existing = await loadSessionMessages(sessionId);
  if (finalMessages.length <= existing.length) {
    return;
  }

  const delta = finalMessages.slice(existing.length).filter(
    (m) => m.role === "user" || m.role === "assistant",
  );

  if (delta.length > 0) {
    await appendSessionMessages(sessionId, delta);
  }
}
