"use server";

import { eq } from "drizzle-orm";
import { db, witnessGroups } from "@/db";
import type { WitnessGroupRecord } from "@/lib/assistant/types";
import { requireUserId } from "@/lib/witness/require-user";

function toWitnessGroupRecord(row: typeof witnessGroups.$inferSelect): WitnessGroupRecord {
  return {
    id: row.id,
    ownerClerkId: row.ownerClerkId,
    name: row.name,
    commitment: row.commitment,
    merkleRoot: row.merkleRoot,
    boardId: row.boardId,
    calendarPulseId: row.calendarPulseId,
    boardPulseId: row.boardPulseId,
    isOpen: row.isOpen,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function createWitnessGroup(input: {
  name: string;
  boardId?: number;
  calendarPulseId?: number;
  boardPulseId?: number;
  commitment?: string;
}): Promise<WitnessGroupRecord> {
  const userId = await requireUserId();
  const [row] = await db
    .insert(witnessGroups)
    .values({
      ownerClerkId: userId,
      name: input.name,
      boardId: input.boardId ?? null,
      calendarPulseId: input.calendarPulseId ?? null,
      boardPulseId: input.boardPulseId ?? null,
      commitment: input.commitment ?? null,
    })
    .returning();

  return toWitnessGroupRecord(row);
}

export async function getWitnessGroup(groupId: number): Promise<WitnessGroupRecord | null> {
  const [row] = await db
    .select()
    .from(witnessGroups)
    .where(eq(witnessGroups.id, groupId))
    .limit(1);
  return row ? toWitnessGroupRecord(row) : null;
}

/** Owner or open-group participant may read group metadata. */
export async function getWitnessGroupForParticipant(
  groupId: number,
): Promise<WitnessGroupRecord> {
  const userId = await requireUserId();
  const [row] = await db
    .select()
    .from(witnessGroups)
    .where(eq(witnessGroups.id, groupId))
    .limit(1);

  if (!row) {
    throw new Error("Witness group not found");
  }
  if (!row.isOpen && row.ownerClerkId !== userId) {
    throw new Error("Witness group is closed");
  }

  return toWitnessGroupRecord(row);
}
