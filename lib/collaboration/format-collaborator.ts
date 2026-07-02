import type { CollaboratorDisplayRecord, CollaboratorRole } from "@/lib/collaboration/types";
import { isCollaboratorRole } from "@/lib/collaboration/types";
import { maskEmail } from "@/lib/mask-email";

type CollaboratorRow = {
  id: number;
  email: string;
  clerkId: string | null;
  role: string;
  invitedByClerkId: string;
  acceptedAt: Date | null;
};

export function toCollaboratorDisplayRecord(
  row: CollaboratorRow,
  userByClerkId: Map<string, { name: string | null; email: string }>,
): CollaboratorDisplayRecord {
  const user = row.clerkId ? userByClerkId.get(row.clerkId) : undefined;
  const role: CollaboratorRole = isCollaboratorRole(row.role) ? row.role : "editor";

  return {
    id: row.id,
    email: row.email,
    clerkId: row.clerkId,
    role,
    invitedByClerkId: row.invitedByClerkId,
    acceptedAt: row.acceptedAt ? row.acceptedAt.toISOString() : null,
    displayName: user?.name ?? null,
    displayEmail: maskEmail(row.email),
    isPending: row.acceptedAt === null,
  };
}
