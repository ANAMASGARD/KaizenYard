import { auth, currentUser } from "@clerk/nextjs/server";
import { eq, sql } from "drizzle-orm";
import { db, users, type User } from "@/db";
import { resolvePendingInvites as resolveKanbanInvites } from "@/lib/kanban/collaboration-actions";
import { resolvePendingNoteInvites } from "@/lib/notes/collaboration-actions";
import { resolvePendingSpaceInvites } from "@/lib/pages/collaboration-actions";
import { resolvePendingWhiteboardInvites } from "@/lib/whiteboard/collaboration-actions";
import { withDbRetry } from "@/lib/with-db-retry";

async function finalizeUserSync(
  userId: string,
  email: string,
  row: User,
): Promise<User> {
  await resolveKanbanInvites(userId, email);
  await resolvePendingNoteInvites(userId, email);
  await resolvePendingSpaceInvites(userId, email);
  await resolvePendingWhiteboardInvites(userId, email);
  return row;
}

export async function syncCurrentUser() {
  return withDbRetry(async () => {
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
      [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") ||
      null;

    const [byClerk] = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, userId))
      .limit(1);

    if (byClerk) {
      const emailOwnedByOther = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      const canUpdateEmail =
        emailOwnedByOther.length === 0 || emailOwnedByOther[0].id === byClerk.id;

      if (
        canUpdateEmail &&
        (byClerk.email !== email || byClerk.name !== name)
      ) {
        const [row] = await db
          .update(users)
          .set({
            email,
            name,
            updatedAt: sql`now()`,
          })
          .where(eq(users.clerkId, userId))
          .returning();
        return finalizeUserSync(userId, email, row);
      }

      return finalizeUserSync(userId, email, byClerk);
    }

    const [byEmail] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (byEmail) {
      const [row] = await db
        .update(users)
        .set({
          clerkId: userId,
          name,
          updatedAt: sql`now()`,
        })
        .where(eq(users.email, email))
        .returning();
      return finalizeUserSync(userId, email, row);
    }

    const [row] = await db
      .insert(users)
      .values({
        clerkId: userId,
        email,
        name,
      })
      .returning();

    return finalizeUserSync(userId, email, row);
  });
}
