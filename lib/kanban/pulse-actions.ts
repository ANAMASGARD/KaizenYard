"use server";

import { createHmac, randomBytes } from "node:crypto";
import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { db, kanbanTaskPulseVotes, kanbanTaskPulses, kanbanTasks } from "@/db";
import {
  DEFAULT_TASK_PULSE_QUESTION,
  isTaskPulseVoteType,
  type TaskPulseNote,
  type TaskPulseRecord,
  type TaskPulseTally,
  type TaskPulseVoteType,
} from "@/lib/kanban/pulse-types";

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

async function getTallyAndNotes(pulseId: number): Promise<{
  tally: TaskPulseTally;
  notes: TaskPulseNote[];
}> {
  const votes = await db
    .select({
      vote: kanbanTaskPulseVotes.vote,
      note: kanbanTaskPulseVotes.note,
    })
    .from(kanbanTaskPulseVotes)
    .where(eq(kanbanTaskPulseVotes.pulseId, pulseId));

  const tally: TaskPulseTally = {
    onTrack: 0,
    atRisk: 0,
    blocked: 0,
    total: 0,
  };
  const notes: TaskPulseNote[] = [];

  for (const v of votes) {
    if (v.vote === "on_track") tally.onTrack += 1;
    else if (v.vote === "at_risk") tally.atRisk += 1;
    else if (v.vote === "blocked") tally.blocked += 1;
    tally.total += 1;
    if (v.note?.trim()) {
      notes.push({
        vote: v.vote as TaskPulseVoteType,
        note: v.note.trim(),
      });
    }
  }

  return { tally, notes };
}

export async function countRiskVotesForTask(taskId: number): Promise<number> {
  const [pulse] = await db
    .select({ id: kanbanTaskPulses.id })
    .from(kanbanTaskPulses)
    .where(
      and(
        eq(kanbanTaskPulses.taskId, taskId),
        eq(kanbanTaskPulses.isOpen, true),
      ),
    );

  if (!pulse) return 0;

  const { tally } = await getTallyAndNotes(pulse.id);
  return tally.atRisk + tally.blocked;
}

async function toPulseRecord(
  pulse: typeof kanbanTaskPulses.$inferSelect,
  taskTitle: string,
  options: {
    hasVoted: boolean;
    userVote: TaskPulseVoteType | null;
    showResults: boolean;
  },
): Promise<TaskPulseRecord> {
  const { tally, notes } = await getTallyAndNotes(pulse.id);
  const emptyTally: TaskPulseTally = {
    onTrack: 0,
    atRisk: 0,
    blocked: 0,
    total: 0,
  };

  return {
    id: pulse.id,
    taskId: pulse.taskId,
    taskTitle,
    question: pulse.question,
    shareToken: pulse.shareToken,
    isOpen: pulse.isOpen,
    closesAt: pulse.closesAt ? pulse.closesAt.toISOString() : null,
    tally: options.showResults ? tally : emptyTally,
    notes: options.showResults ? notes : [],
    hasVoted: options.hasVoted,
    userVote: options.userVote,
  };
}

export async function createTaskPulse(
  taskId: number,
  question?: string,
): Promise<TaskPulseRecord> {
  const userId = await requireUserId();

  const [task] = await db
    .select()
    .from(kanbanTasks)
    .where(and(eq(kanbanTasks.id, taskId), eq(kanbanTasks.clerkId, userId)));

  if (!task) {
    throw new Error("Task not found");
  }

  const [existingOpen] = await db
    .select({ id: kanbanTaskPulses.id })
    .from(kanbanTaskPulses)
    .where(
      and(eq(kanbanTaskPulses.taskId, taskId), eq(kanbanTaskPulses.isOpen, true)),
    );

  if (existingOpen) {
    throw new Error("Close the current check-in before starting a new one");
  }

  const [pulse] = await db
    .insert(kanbanTaskPulses)
    .values({
      taskId,
      ownerClerkId: userId,
      question: question?.trim() || DEFAULT_TASK_PULSE_QUESTION,
      shareToken: generateShareToken(),
    })
    .returning();

  return await toPulseRecord(pulse, task.title, {
    hasVoted: false,
    userVote: null,
    showResults: true,
  });
}

export async function getTaskPulseForTask(
  taskId: number,
): Promise<TaskPulseRecord | null> {
  const userId = await requireUserId();

  const [task] = await db
    .select()
    .from(kanbanTasks)
    .where(and(eq(kanbanTasks.id, taskId), eq(kanbanTasks.clerkId, userId)));

  if (!task) {
    throw new Error("Task not found");
  }

  const [pulse] = await db
    .select()
    .from(kanbanTaskPulses)
    .where(
      and(eq(kanbanTaskPulses.taskId, taskId), eq(kanbanTaskPulses.isOpen, true)),
    );

  if (!pulse) return null;

  return await toPulseRecord(pulse, task.title, {
    hasVoted: false,
    userVote: null,
    showResults: true,
  });
}

export async function getTaskPulseByToken(
  token: string,
): Promise<TaskPulseRecord | null> {
  const userId = await requireUserId();

  const [pulse] = await db
    .select()
    .from(kanbanTaskPulses)
    .where(eq(kanbanTaskPulses.shareToken, token));

  if (!pulse) return null;

  const [task] = await db
    .select({ title: kanbanTasks.title })
    .from(kanbanTasks)
    .where(eq(kanbanTasks.id, pulse.taskId));

  const hash = voterTokenHash(pulse.id, userId);
  const [existingVote] = await db
    .select()
    .from(kanbanTaskPulseVotes)
    .where(
      and(
        eq(kanbanTaskPulseVotes.pulseId, pulse.id),
        eq(kanbanTaskPulseVotes.voterTokenHash, hash),
      ),
    );

  const hasVoted = Boolean(existingVote);
  const showResults = hasVoted || !pulse.isOpen;

  return await toPulseRecord(pulse, task?.title ?? "Task", {
    hasVoted,
    userVote: (existingVote?.vote as TaskPulseVoteType) ?? null,
    showResults,
  });
}

export async function castTaskPulseVote(
  token: string,
  vote: TaskPulseVoteType,
  note?: string,
): Promise<TaskPulseRecord> {
  if (!isTaskPulseVoteType(vote)) {
    throw new Error("Invalid vote");
  }

  const userId = await requireUserId();

  const [pulse] = await db
    .select()
    .from(kanbanTaskPulses)
    .where(eq(kanbanTaskPulses.shareToken, token));

  if (!pulse) {
    throw new Error("Pulse not found");
  }
  if (!pulse.isOpen) {
    throw new Error("This check-in is closed");
  }

  const hash = voterTokenHash(pulse.id, userId);

  await db
    .insert(kanbanTaskPulseVotes)
    .values({
      pulseId: pulse.id,
      voterTokenHash: hash,
      vote,
      note: note?.trim() || null,
    })
    .onConflictDoUpdate({
      target: [kanbanTaskPulseVotes.pulseId, kanbanTaskPulseVotes.voterTokenHash],
      set: { vote, note: note?.trim() || null },
    });

  const riskCount = await countRiskVotesForTask(pulse.taskId);
  const { runAutomationsForTask } = await import("@/lib/kanban/automation-actions");
  await runAutomationsForTask(
    pulse.taskId,
    { type: "risk_pulse_flagged", riskCount },
    { fromAutomation: false },
  );

  const result = await getTaskPulseByToken(token);
  if (!result) throw new Error("Pulse not found");
  return result;
}

export async function closeTaskPulse(pulseId: number): Promise<void> {
  const userId = await requireUserId();

  await db
    .update(kanbanTaskPulses)
    .set({ isOpen: false, closesAt: new Date() })
    .where(
      and(
        eq(kanbanTaskPulses.id, pulseId),
        eq(kanbanTaskPulses.ownerClerkId, userId),
      ),
    );
}

export async function getBoardPulseRiskSummaries(
  taskIds: number[],
): Promise<Record<number, { atRisk: number; blocked: number }>> {
  if (taskIds.length === 0) return {};

  const result: Record<number, { atRisk: number; blocked: number }> = {};

  for (const taskId of taskIds) {
    const [pulse] = await db
      .select({ id: kanbanTaskPulses.id })
      .from(kanbanTaskPulses)
      .where(
        and(
          eq(kanbanTaskPulses.taskId, taskId),
          eq(kanbanTaskPulses.isOpen, true),
        ),
      );

    if (!pulse) continue;

    const { tally } = await getTallyAndNotes(pulse.id);
    if (tally.atRisk > 0 || tally.blocked > 0) {
      result[taskId] = { atRisk: tally.atRisk, blocked: tally.blocked };
    }
  }

  return result;
}
