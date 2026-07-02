"use server";

import { eq } from "drizzle-orm";
import { assistantSessions, db } from "@/db";
import { getAssistantSessionForUser } from "@/lib/assistant/sessions/actions";

export async function saveLlmViewSnapshot(
  agentSessionId: string,
  snapshot: string,
): Promise<void> {
  await db
    .update(assistantSessions)
    .set({
      llmViewSnapshot: snapshot,
      llmViewUpdatedAt: new Date(),
    })
    .where(eq(assistantSessions.agentSessionId, agentSessionId));
}

export async function getLlmViewSnapshotForSession(
  sessionId: number,
): Promise<string | null> {
  const session = await getAssistantSessionForUser(sessionId);
  if (!session) {
    return null;
  }

  const [row] = await db
    .select({
      snapshot: assistantSessions.llmViewSnapshot,
      updatedAt: assistantSessions.llmViewUpdatedAt,
    })
    .from(assistantSessions)
    .where(eq(assistantSessions.id, sessionId))
    .limit(1);

  if (!row?.snapshot || !row.updatedAt) {
    return null;
  }

  const ageMs = Date.now() - row.updatedAt.getTime();
  if (ageMs > 24 * 60 * 60 * 1000) {
    return null;
  }

  return row.snapshot;
}
