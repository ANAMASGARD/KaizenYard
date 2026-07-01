"use server";

import { createHmac, randomBytes } from "node:crypto";
import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import {
  calendarItems,
  calendarMeetingPulses,
  calendarPulseVotes,
  db,
} from "@/db";
import type {
  MeetingPulseRecord,
  PulseTally,
  PulseVoteType,
} from "@/lib/calendar/types";

const PULSE_SECRET =
  process.env.CALENDAR_PULSE_SECRET ?? "kaizenyard-pulse-dev-secret";

async function requireUserId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }
  return userId;
}

function voterTokenHash(pulseId: number, clerkId: string): string {
  return createHmac("sha256", PULSE_SECRET)
    .update(`${pulseId}:${clerkId}`)
    .digest("hex");
}

function generateShareToken(): string {
  return randomBytes(16).toString("base64url");
}

async function getTally(pulseId: number): Promise<PulseTally> {
  const votes = await db
    .select({ vote: calendarPulseVotes.vote })
    .from(calendarPulseVotes)
    .where(eq(calendarPulseVotes.pulseId, pulseId));

  const tally: PulseTally = { keep: 0, drop: 0, unsure: 0, total: 0 };
  for (const v of votes) {
    if (v.vote === "keep") tally.keep += 1;
    else if (v.vote === "drop") tally.drop += 1;
    else if (v.vote === "unsure") tally.unsure += 1;
    tally.total += 1;
  }
  return tally;
}

export async function createMeetingPulse(
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

  const [pulse] = await db
    .insert(calendarMeetingPulses)
    .values({
      ownerClerkId: userId,
      calendarItemId,
      question: question ?? "Is this meeting still worth keeping?",
      shareToken: generateShareToken(),
    })
    .returning();

  return {
    id: pulse.id,
    calendarItemId: pulse.calendarItemId,
    question: pulse.question,
    shareToken: pulse.shareToken,
    isOpen: pulse.isOpen,
    closesAt: pulse.closesAt ? pulse.closesAt.toISOString() : null,
    tally: { keep: 0, drop: 0, unsure: 0, total: 0 },
    hasVoted: false,
    userVote: null,
  };
}

export async function getPulseByToken(
  token: string,
): Promise<MeetingPulseRecord | null> {
  const userId = await requireUserId();

  const [pulse] = await db
    .select()
    .from(calendarMeetingPulses)
    .where(eq(calendarMeetingPulses.shareToken, token));

  if (!pulse) return null;

  const hash = voterTokenHash(pulse.id, userId);
  const [existingVote] = await db
    .select()
    .from(calendarPulseVotes)
    .where(
      and(
        eq(calendarPulseVotes.pulseId, pulse.id),
        eq(calendarPulseVotes.voterTokenHash, hash),
      ),
    );

  const tally = await getTally(pulse.id);
  const hasVoted = Boolean(existingVote);
  const showTally = hasVoted || !pulse.isOpen;

  return {
    id: pulse.id,
    calendarItemId: pulse.calendarItemId,
    question: pulse.question,
    shareToken: pulse.shareToken,
    isOpen: pulse.isOpen,
    closesAt: pulse.closesAt ? pulse.closesAt.toISOString() : null,
    tally: showTally ? tally : { keep: 0, drop: 0, unsure: 0, total: 0 },
    hasVoted,
    userVote: (existingVote?.vote as PulseVoteType) ?? null,
  };
}

export async function getPulseForItem(
  calendarItemId: number,
): Promise<MeetingPulseRecord | null> {
  const userId = await requireUserId();

  const [pulse] = await db
    .select()
    .from(calendarMeetingPulses)
    .where(
      and(
        eq(calendarMeetingPulses.calendarItemId, calendarItemId),
        eq(calendarMeetingPulses.ownerClerkId, userId),
        eq(calendarMeetingPulses.isOpen, true),
      ),
    );

  if (!pulse) return null;

  const tally = await getTally(pulse.id);
  return {
    id: pulse.id,
    calendarItemId: pulse.calendarItemId,
    question: pulse.question,
    shareToken: pulse.shareToken,
    isOpen: pulse.isOpen,
    closesAt: pulse.closesAt ? pulse.closesAt.toISOString() : null,
    tally,
    hasVoted: false,
    userVote: null,
  };
}

export async function castPulseVote(
  token: string,
  vote: PulseVoteType,
): Promise<MeetingPulseRecord> {
  const userId = await requireUserId();

  const [pulse] = await db
    .select()
    .from(calendarMeetingPulses)
    .where(eq(calendarMeetingPulses.shareToken, token));

  if (!pulse) {
    throw new Error("Pulse not found");
  }
  if (!pulse.isOpen) {
    throw new Error("This pulse is closed");
  }

  const hash = voterTokenHash(pulse.id, userId);

  await db
    .insert(calendarPulseVotes)
    .values({
      pulseId: pulse.id,
      voterTokenHash: hash,
      vote,
    })
    .onConflictDoUpdate({
      target: [calendarPulseVotes.pulseId, calendarPulseVotes.voterTokenHash],
      set: { vote },
    });

  const result = await getPulseByToken(token);
  if (!result) throw new Error("Pulse not found");
  return result;
}

export async function closePulse(pulseId: number): Promise<void> {
  const userId = await requireUserId();

  await db
    .update(calendarMeetingPulses)
    .set({ isOpen: false })
    .where(
      and(
        eq(calendarMeetingPulses.id, pulseId),
        eq(calendarMeetingPulses.ownerClerkId, userId),
      ),
    );
}
