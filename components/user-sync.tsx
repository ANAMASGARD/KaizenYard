import { syncCurrentUser } from "@/lib/sync-user";
import { formatDbError } from "@/lib/format-db-error";

function isBenignSyncError(message: string): boolean {
  return (
    message.includes("Dynamic server usage") ||
    message.includes("couldn't be rendered statically")
  );
}

export async function UserSync() {
  try {
    await syncCurrentUser();
  } catch (error) {
    const message = formatDbError(error);
    if (!isBenignSyncError(message)) {
      console.error(
        "[UserSync] Failed to sync Clerk user to database:",
        message,
      );
    }
  }
  return null;
}
