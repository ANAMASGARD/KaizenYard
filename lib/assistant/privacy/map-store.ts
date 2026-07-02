"use server";

import { createHmac, randomBytes } from "node:crypto";
import { and, eq, gt, lt } from "drizzle-orm";
import { assistantPrivacyMaps, db } from "@/db";
import { requireUserId } from "@/lib/witness/require-user";

const PRIVACY_MAP_SECRET =
  process.env.ASSISTANT_PRIVACY_MAP_SECRET ?? "kaizenyard-assistant-privacy-dev";

/** Integrity-sealed token map (HMAC + base64). Not encryption-at-rest. */
function sealMap(payload: Record<string, string>): string {
  const json = JSON.stringify(payload);
  const iv = randomBytes(12).toString("hex");
  const hmac = createHmac("sha256", PRIVACY_MAP_SECRET).update(`${iv}:${json}`).digest("hex");
  return `${iv}.${hmac}.${Buffer.from(json).toString("base64url")}`;
}

function unsealMap(sealed: string): Record<string, string> {
  const [iv, hmac, b64] = sealed.split(".");
  if (!iv || !hmac || !b64) {
    return {};
  }
  const json = Buffer.from(b64, "base64url").toString("utf8");
  const expected = createHmac("sha256", PRIVACY_MAP_SECRET).update(`${iv}:${json}`).digest("hex");
  if (expected !== hmac) {
    return {};
  }
  return JSON.parse(json) as Record<string, string>;
}

export async function savePrivacyMap(
  agentSessionId: string,
  map: Record<string, string>,
): Promise<void> {
  const userId = await requireUserId();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const encryptedMap = sealMap(map);

  const existing = await db
    .select()
    .from(assistantPrivacyMaps)
    .where(eq(assistantPrivacyMaps.agentSessionId, agentSessionId))
    .limit(1);

  if (existing[0]) {
    await db
      .update(assistantPrivacyMaps)
      .set({ encryptedMap, expiresAt })
      .where(eq(assistantPrivacyMaps.id, existing[0].id));
    return;
  }

  await db.insert(assistantPrivacyMaps).values({
    agentSessionId,
    clerkId: userId,
    encryptedMap,
    expiresAt,
  });
}

export async function loadPrivacyMap(
  agentSessionId: string,
): Promise<Record<string, string>> {
  const userId = await requireUserId();
  const now = new Date();
  const [row] = await db
    .select()
    .from(assistantPrivacyMaps)
    .where(
      and(
        eq(assistantPrivacyMaps.agentSessionId, agentSessionId),
        eq(assistantPrivacyMaps.clerkId, userId),
        gt(assistantPrivacyMaps.expiresAt, now),
      ),
    )
    .limit(1);

  if (!row) {
    return {};
  }
  return unsealMap(row.encryptedMap);
}

export async function mergePrivacyMap(
  agentSessionId: string,
  additions: Record<string, string>,
): Promise<Record<string, string>> {
  const current = await loadPrivacyMap(agentSessionId);
  const merged = { ...current, ...additions };
  await savePrivacyMap(agentSessionId, merged);
  return merged;
}

export async function cleanupExpiredPrivacyMaps(): Promise<void> {
  await db
    .delete(assistantPrivacyMaps)
    .where(lt(assistantPrivacyMaps.expiresAt, new Date()));
}
