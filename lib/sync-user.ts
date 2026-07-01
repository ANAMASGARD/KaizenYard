import { auth, currentUser } from "@clerk/nextjs/server";
import { sql } from "drizzle-orm";
import { db, users } from "@/db";

export async function syncCurrentUser() {
  const { userId } = await auth();
  if (!userId) {
    return null;
  }

  const clerkUser = await currentUser();
  if (!clerkUser) {
    return null;
  }

  const email = clerkUser.primaryEmailAddress?.emailAddress;
  if (!email) {
    return null;
  }

  const name =
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || null;

  const [row] = await db
    .insert(users)
    .values({
      clerkId: userId,
      email,
      name,
    })
    .onConflictDoUpdate({
      target: users.clerkId,
      set: {
        email,
        name,
        updatedAt: sql`now()`,
      },
    })
    .returning();

  return row;
}
