import { inArray } from "drizzle-orm";
import { db, users } from "@/db";
import { initialsFromDisplayName } from "@/lib/pages/initials";

export { initialsFromDisplayName } from "@/lib/pages/initials";

export async function resolveInitialsForClerkIds(
  clerkIds: string[],
): Promise<Map<string, string>> {
  const unique = [...new Set(clerkIds.filter(Boolean))];
  const map = new Map<string, string>();
  if (unique.length === 0) return map;

  const rows = await db
    .select({ clerkId: users.clerkId, name: users.name, email: users.email })
    .from(users)
    .where(inArray(users.clerkId, unique));

  for (const row of rows) {
    map.set(row.clerkId, initialsFromDisplayName(row.name, row.email));
  }

  for (const id of unique) {
    if (!map.has(id)) {
      map.set(id, "??");
    }
  }

  return map;
}
