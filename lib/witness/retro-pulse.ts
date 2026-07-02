"use server";

import { randomBytes } from "node:crypto";
import { and, eq } from "drizzle-orm";
import {
  calendarItems,
  calendarMeetingPulses,
  db,
  kanbanBoardPulses,
  kanbanBoards,
  witnessGroups,
} from "@/db";
import type { MeetingPulseRecord } from "@/lib/calendar/types";
import { requireUserId } from "@/lib/witness/require-user";

function generateShareToken(): string {
  return randomBytes(16).toString("base64url");
}

export type BoardPulseRecord = {
  id: number;
  boardId: number;
  question: string;
  pulseType: string;
  shareToken: string;
  witnessGroupId: number | null;
  isOpen: boolean;
  sharePath: string;
};

export async function createBoardRetroPulse(
  boardId: number,
  question?: string,
): Promise<BoardPulseRecord> {
  const userId = await requireUserId();

  const [board] = await db
    .select()
    .from(kanbanBoards)
    .where(and(eq(kanbanBoards.id, boardId), eq(kanbanBoards.clerkId, userId)));

  if (!board) {
    throw new Error("Board not found");
  }

  const pulseQuestion = question ?? "What should we improve this sprint?";

  const core = await db.transaction(async (tx) => {
    const [group] = await tx
      .insert(witnessGroups)
      .values({
        ownerClerkId: userId,
        name: `Retro: ${board.name}`,
        boardId,
      })
      .returning();

    const [pulse] = await tx
      .insert(kanbanBoardPulses)
      .values({
        boardId,
        ownerClerkId: userId,
        question: pulseQuestion,
        pulseType: "retro",
        shareToken: generateShareToken(),
        witnessGroupId: group.id,
      })
      .returning();

    await tx
      .update(witnessGroups)
      .set({ boardPulseId: pulse.id })
      .where(eq(witnessGroups.id, group.id));

    return { group, pulse };
  });

  return {
    id: core.pulse.id,
    boardId,
    question: core.pulse.question,
    pulseType: core.pulse.pulseType,
    shareToken: core.pulse.shareToken,
    witnessGroupId: core.pulse.witnessGroupId,
    isOpen: core.pulse.isOpen,
    sharePath: `/assistant?witness=${core.group.id}&pulse=${core.pulse.shareToken}`,
  };
}

export async function createRetroMeetingPulse(
  calendarItemId: number,
  question?: string,
): Promise<MeetingPulseRecord> {
  const userId = await requireUserId();

  const [item] = await db
    .select()
    .from(calendarItems)
    .where(
      and(eq(calendarItems.id, calendarItemId), eq(calendarItems.clerkId, userId)),
    );

  if (!item) {
    throw new Error("Item not found");
  }

  const pulseQuestion = question ?? "What should we change about this meeting?";

  const core = await db.transaction(async (tx) => {
    const [group] = await tx
      .insert(witnessGroups)
      .values({
        ownerClerkId: userId,
        name: `Retro: ${item.title}`,
      })
      .returning();

    const [pulse] = await tx
      .insert(calendarMeetingPulses)
      .values({
        ownerClerkId: userId,
        calendarItemId,
        question: pulseQuestion,
        pulseType: "retro",
        shareToken: generateShareToken(),
        witnessGroupId: group.id,
      })
      .returning();

    await tx
      .update(witnessGroups)
      .set({ calendarPulseId: pulse.id })
      .where(eq(witnessGroups.id, group.id));

    return { group, pulse };
  });

  return {
    id: core.pulse.id,
    calendarItemId: core.pulse.calendarItemId,
    question: core.pulse.question,
    shareToken: core.pulse.shareToken,
    pulseType: core.pulse.pulseType,
    witnessGroupId: core.pulse.witnessGroupId,
    isOpen: core.pulse.isOpen,
    closesAt: core.pulse.closesAt ? core.pulse.closesAt.toISOString() : null,
    tally: { keep: 0, drop: 0, unsure: 0, total: 0 },
    hasVoted: false,
    userVote: null,
    sharePath: `/assistant?witness=${core.group.id}&pulse=${core.pulse.shareToken}`,
  };
}

export async function getBoardPulseByToken(
  shareToken: string,
): Promise<BoardPulseRecord | null> {
  const [pulse] = await db
    .select()
    .from(kanbanBoardPulses)
    .where(eq(kanbanBoardPulses.shareToken, shareToken))
    .limit(1);

  if (!pulse) {
    return null;
  }

  return {
    id: pulse.id,
    boardId: pulse.boardId,
    question: pulse.question,
    pulseType: pulse.pulseType,
    shareToken: pulse.shareToken,
    witnessGroupId: pulse.witnessGroupId,
    isOpen: pulse.isOpen,
    sharePath: `/assistant?witness=${pulse.witnessGroupId}&pulse=${pulse.shareToken}`,
  };
}
