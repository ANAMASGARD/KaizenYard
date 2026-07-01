import { syncCurrentUser } from "@/lib/sync-user";

export async function UserSync() {
  await syncCurrentUser();
  return null;
}
