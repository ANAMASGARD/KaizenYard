import { and, eq, isNotNull } from "drizzle-orm";
import { db, whiteboardCollaborators, whiteboards } from "@/db";
import { hasMinRole } from "@/lib/collaboration/types";
import {
  isCollaboratorRole,
  type WhiteboardRole,
} from "@/lib/whiteboard/room";

export type { WhiteboardRole, CollaboratorRole } from "@/lib/whiteboard/room";

export async function getWhiteboardRole(
  whiteboardId: number,
  clerkId: string,
): Promise<WhiteboardRole | null> {
  const [whiteboard] = await db
    .select()
    .from(whiteboards)
    .where(eq(whiteboards.id, whiteboardId))
    .limit(1);

  if (!whiteboard) return null;

  if (whiteboard.deletedAt !== null && whiteboard.clerkId !== clerkId) {
    return null;
  }

  if (whiteboard.clerkId === clerkId) return "owner";

  const [collaborator] = await db
    .select()
    .from(whiteboardCollaborators)
    .where(
      and(
        eq(whiteboardCollaborators.whiteboardId, whiteboardId),
        eq(whiteboardCollaborators.clerkId, clerkId),
        isNotNull(whiteboardCollaborators.acceptedAt),
      ),
    )
    .limit(1);

  if (!collaborator) return null;
  if (!isCollaboratorRole(collaborator.role)) return null;
  return collaborator.role;
}

export async function requireWhiteboardAccess(
  whiteboardId: number,
  clerkId: string,
  minRole: "editor" | "viewer",
): Promise<WhiteboardRole> {
  const role = await getWhiteboardRole(whiteboardId, clerkId);
  if (!role) {
    throw new Error("Whiteboard not found");
  }
  if (!hasMinRole(role, minRole)) {
    throw new Error("Insufficient permissions");
  }
  return role;
}

export async function requireWhiteboardOwnership(
  whiteboardId: number,
  clerkId: string,
): Promise<void> {
  const role = await getWhiteboardRole(whiteboardId, clerkId);
  if (role !== "owner") {
    throw new Error("Whiteboard not found");
  }
}
