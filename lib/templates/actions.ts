"use server";

import { randomUUID } from "node:crypto";
import { auth } from "@clerk/nextjs/server";
import { and, desc, eq, sql } from "drizzle-orm";
import { db, generatedApps } from "@/db";
import {
  generatedAppRowToListItem,
  generatedAppRowToPinned,
  generatedAppRowToRecord,
} from "@/lib/templates/mappers";
import { parseGeneratedAppDefinition, parseRuntimeState } from "@/lib/templates/schema";
import type {
  GeneratedAppDefinition,
  GeneratedAppListItem,
  GeneratedAppRecord,
  PinnedSidebarApp,
} from "@/lib/templates/types";
import { SIDEBAR_PIN_LIMIT } from "@/lib/templates/types";
import {
  getGeneratedAppByShareToken,
  requireGeneratedAppAccess,
  requireGeneratedAppOwnership,
} from "@/lib/templates/access";

async function requireUserId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }
  return userId;
}

async function requireOwnedApp(
  appId: number,
  clerkId: string,
): Promise<typeof generatedApps.$inferSelect> {
  await requireGeneratedAppOwnership(appId, clerkId);
  const [row] = await db.select().from(generatedApps).where(eq(generatedApps.id, appId)).limit(1);
  return row;
}

export async function listGeneratedApps(): Promise<GeneratedAppListItem[]> {
  const userId = await requireUserId();

  const rows = await db
    .select()
    .from(generatedApps)
    .where(eq(generatedApps.clerkId, userId))
    .orderBy(desc(generatedApps.createdAt));

  return rows.map(generatedAppRowToListItem);
}

export async function listPinnedGeneratedApps(): Promise<PinnedSidebarApp[]> {
  const userId = await requireUserId();

  const rows = await db
    .select()
    .from(generatedApps)
    .where(
      and(
        eq(generatedApps.clerkId, userId),
        eq(generatedApps.sidebarPinned, true),
      ),
    )
    .orderBy(generatedApps.sidebarOrder, desc(generatedApps.createdAt));

  return rows.map(generatedAppRowToPinned);
}

export async function getGeneratedApp(appId: number): Promise<GeneratedAppRecord> {
  const userId = await requireUserId();
  await requireGeneratedAppAccess(appId, userId, "viewer");
  const [row] = await db.select().from(generatedApps).where(eq(generatedApps.id, appId)).limit(1);
  if (!row) {
    throw new Error("App not found");
  }
  return generatedAppRowToRecord(row);
}

export async function getGeneratedAppByToken(
  token: string,
): Promise<GeneratedAppRecord | null> {
  const row = await getGeneratedAppByShareToken(token);
  return row ? generatedAppRowToRecord(row) : null;
}

export async function createGeneratedApp(
  definition: GeneratedAppDefinition,
): Promise<GeneratedAppRecord> {
  const userId = await requireUserId();
  const parsed = parseGeneratedAppDefinition(definition);
  if (!parsed) {
    throw new Error("Invalid app definition");
  }

  const [row] = await db
    .insert(generatedApps)
    .values({
      clerkId: userId,
      appName: parsed.appName,
      description: parsed.description,
      icon: parsed.icon,
      color: parsed.color,
      layout: parsed.layout,
      definition: parsed,
      runtimeState: parsed.sampleData,
    })
    .returning();

  return generatedAppRowToRecord(row);
}

export async function deleteGeneratedApp(appId: number): Promise<void> {
  const userId = await requireUserId();
  await requireGeneratedAppOwnership(appId, userId);

  await db
    .delete(generatedApps)
    .where(and(eq(generatedApps.id, appId), eq(generatedApps.clerkId, userId)));
}

export async function pinGeneratedAppToSidebar(
  appId: number,
): Promise<GeneratedAppListItem> {
  const userId = await requireUserId();
  const row = await requireOwnedApp(appId, userId);

  if (row.sidebarPinned) {
    return generatedAppRowToListItem(row);
  }

  const [countRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(generatedApps)
    .where(
      and(
        eq(generatedApps.clerkId, userId),
        eq(generatedApps.sidebarPinned, true),
      ),
    );

  const pinnedCount = countRow?.count ?? 0;
  if (pinnedCount >= SIDEBAR_PIN_LIMIT) {
    throw new Error(
      `You can pin at most ${SIDEBAR_PIN_LIMIT} generated apps to the sidebar.`,
    );
  }

  const [updated] = await db
    .update(generatedApps)
    .set({
      sidebarPinned: true,
      sidebarOrder: pinnedCount,
      updatedAt: new Date(),
    })
    .where(and(eq(generatedApps.id, appId), eq(generatedApps.clerkId, userId)))
    .returning();

  return generatedAppRowToListItem(updated);
}

export async function unpinGeneratedAppFromSidebar(
  appId: number,
): Promise<GeneratedAppListItem> {
  const userId = await requireUserId();
  await requireOwnedApp(appId, userId);

  const [updated] = await db
    .update(generatedApps)
    .set({
      sidebarPinned: false,
      sidebarOrder: null,
      updatedAt: new Date(),
    })
    .where(and(eq(generatedApps.id, appId), eq(generatedApps.clerkId, userId)))
    .returning();

  const pinned = await db
    .select()
    .from(generatedApps)
    .where(
      and(
        eq(generatedApps.clerkId, userId),
        eq(generatedApps.sidebarPinned, true),
      ),
    )
    .orderBy(generatedApps.sidebarOrder);

  await Promise.all(
    pinned.map((item, index) =>
      db
        .update(generatedApps)
        .set({ sidebarOrder: index, updatedAt: new Date() })
        .where(eq(generatedApps.id, item.id)),
    ),
  );

  return generatedAppRowToListItem(updated);
}

export async function updateGeneratedAppRuntimeState(
  appId: number,
  runtimeState: Record<string, unknown>,
): Promise<{ updatedAt: string }> {
  const userId = await requireUserId();
  await requireGeneratedAppAccess(appId, userId, "editor");

  const parsed = parseRuntimeState(runtimeState);
  if (!parsed) {
    throw new Error("Invalid runtime state");
  }

  const [updated] = await db
    .update(generatedApps)
    .set({
      runtimeState: parsed,
      updatedAt: new Date(),
    })
    .where(and(eq(generatedApps.id, appId), eq(generatedApps.clerkId, userId)))
    .returning({ updatedAt: generatedApps.updatedAt });

  return { updatedAt: updated.updatedAt.toISOString() };
}

export async function updateGeneratedAppShareSettings(input: {
  appId: number;
  shareEnabled: boolean;
  shareMode: "private" | "link" | "collaborators";
  isZkShare?: boolean;
  shareCommitment?: string | null;
  shareSalt?: string | null;
  shareNullifierRoot?: string | null;
}): Promise<GeneratedAppRecord> {
  const userId = await requireUserId();
  await requireGeneratedAppOwnership(input.appId, userId);
  const [existing] = await db
    .select()
    .from(generatedApps)
    .where(and(eq(generatedApps.id, input.appId), eq(generatedApps.clerkId, userId)))
    .limit(1);

  if (!existing) {
    throw new Error("App not found");
  }

  const [updated] = await db
    .update(generatedApps)
    .set({
      shareEnabled: input.shareEnabled,
      shareMode: input.shareMode,
      shareToken: input.shareEnabled ? existing.shareToken ?? randomUUID() : null,
      isZkShare: input.isZkShare ?? false,
      shareCommitment: input.shareCommitment ?? null,
      shareSalt: input.shareSalt ?? null,
      shareNullifierRoot: input.shareNullifierRoot ?? null,
      updatedAt: new Date(),
    })
    .where(and(eq(generatedApps.id, input.appId), eq(generatedApps.clerkId, userId)))
    .returning();

  return generatedAppRowToRecord(updated);
}
