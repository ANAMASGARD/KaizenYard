"use server";

import { and, count, eq } from "drizzle-orm";
import { db, kanbanTasks, witnessAttestations } from "@/db";
import type { PrivacyMode } from "@/lib/assistant/types";
import { getWitnessGroupForParticipant } from "@/lib/witness/groups";
import { requireUserId } from "@/lib/witness/require-user";

/**
 * clerkId is stored for server-side audit and tx-hash updates only.
 * Aggregate APIs never return voter identity.
 */
export async function recordWitnessAttestation(input: {
  witnessGroupId: number;
  nullifier: string;
  actionHash: string;
  resourceType: string;
  resourceId?: number;
  txHash?: string;
  privacyMode?: PrivacyMode;
}): Promise<void> {
  const userId = await requireUserId();
  await getWitnessGroupForParticipant(input.witnessGroupId);

  await db.insert(witnessAttestations).values({
    witnessGroupId: input.witnessGroupId,
    clerkId: userId,
    nullifier: input.nullifier,
    actionHash: input.actionHash,
    resourceType: input.resourceType,
    resourceId: input.resourceId ?? null,
    txHash: input.txHash ?? null,
    privacyMode: input.privacyMode ?? "witness",
  });
}

export async function listWitnessAttestationsForGroup(
  groupId: number,
): Promise<Array<{ resourceType: string; resourceId: number | null; createdAt: string }>> {
  await getWitnessGroupForParticipant(groupId);

  const rows = await db
    .select({
      resourceType: witnessAttestations.resourceType,
      resourceId: witnessAttestations.resourceId,
      createdAt: witnessAttestations.createdAt,
    })
    .from(witnessAttestations)
    .where(eq(witnessAttestations.witnessGroupId, groupId));

  return rows.map((r) => ({
    resourceType: r.resourceType,
    resourceId: r.resourceId,
    createdAt: r.createdAt.toISOString(),
  }));
}

export async function countWitnessAttestations(groupId: number): Promise<number> {
  await getWitnessGroupForParticipant(groupId);

  const [row] = await db
    .select({ value: count() })
    .from(witnessAttestations)
    .where(eq(witnessAttestations.witnessGroupId, groupId));

  return row?.value ?? 0;
}

export async function assertAttestationForAnchor(
  nullifier: string,
  witnessGroupId: number,
): Promise<void> {
  const userId = await requireUserId();
  const [row] = await db
    .select()
    .from(witnessAttestations)
    .where(
      and(
        eq(witnessAttestations.nullifier, nullifier),
        eq(witnessAttestations.witnessGroupId, witnessGroupId),
        eq(witnessAttestations.clerkId, userId),
      ),
    )
    .limit(1);

  if (!row) {
    throw new Error("Attestation not found");
  }

  await getWitnessGroupForParticipant(witnessGroupId);
}

export async function updateWitnessAttestationTxHash(
  nullifier: string,
  txHash: string,
): Promise<void> {
  const userId = await requireUserId();
  await db
    .update(witnessAttestations)
    .set({ txHash })
    .where(
      and(eq(witnessAttestations.nullifier, nullifier), eq(witnessAttestations.clerkId, userId)),
    );
}

export async function tagKanbanTaskDelegate(
  taskId: number,
  delegateAddress: string,
  witnessAttestationHash?: string,
): Promise<void> {
  const userId = await requireUserId();
  await db
    .update(kanbanTasks)
    .set({
      delegateAddress,
      ...(witnessAttestationHash ? { witnessAttestationHash } : {}),
    })
    .where(and(eq(kanbanTasks.id, taskId), eq(kanbanTasks.clerkId, userId)));
}

export async function tagKanbanTaskWitnessAttestation(
  taskId: number,
  witnessAttestationHash: string,
): Promise<void> {
  const userId = await requireUserId();
  await db
    .update(kanbanTasks)
    .set({ witnessAttestationHash })
    .where(and(eq(kanbanTasks.id, taskId), eq(kanbanTasks.clerkId, userId)));
}
