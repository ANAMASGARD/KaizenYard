"use server";

import { and, eq, isNull } from "drizzle-orm";
import { db, spaces } from "@/db";
import { requireUserId } from "@/lib/witness/require-user";

export type VaultSpaceUnlockInfo = {
  id: number;
  name: string;
  vaultCommitment: string;
  vaultSalt: string;
};

export async function listVaultSpacesForAssistant(): Promise<VaultSpaceUnlockInfo[]> {
  const userId = await requireUserId();

  const rows = await db
    .select({
      id: spaces.id,
      name: spaces.name,
      vaultCommitment: spaces.vaultCommitment,
      vaultSalt: spaces.vaultSalt,
    })
    .from(spaces)
    .where(
      and(
        eq(spaces.clerkId, userId),
        eq(spaces.isVault, true),
        isNull(spaces.deletedAt),
      ),
    );

  return rows.filter(
    (row): row is VaultSpaceUnlockInfo =>
      Boolean(row.vaultCommitment && row.vaultSalt),
  );
}
