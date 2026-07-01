import { and, eq, isNotNull } from "drizzle-orm";
import { db, kanbanBoardCollaborators, kanbanBoards } from "@/db";
import {
  isCollaboratorRole,
  type BoardRole,
} from "@/lib/kanban/room";

export type { BoardRole, CollaboratorRole } from "@/lib/kanban/room";

const ROLE_RANK: Record<BoardRole, number> = {
  viewer: 0,
  editor: 1,
  owner: 2,
};

export async function getBoardRole(
  boardId: number,
  clerkId: string,
): Promise<BoardRole | null> {
  const [board] = await db
    .select()
    .from(kanbanBoards)
    .where(eq(kanbanBoards.id, boardId))
    .limit(1);

  if (!board) return null;
  if (board.clerkId === clerkId) return "owner";

  const [collaborator] = await db
    .select()
    .from(kanbanBoardCollaborators)
    .where(
      and(
        eq(kanbanBoardCollaborators.boardId, boardId),
        eq(kanbanBoardCollaborators.clerkId, clerkId),
        isNotNull(kanbanBoardCollaborators.acceptedAt),
      ),
    )
    .limit(1);

  if (!collaborator) return null;
  if (!isCollaboratorRole(collaborator.role)) return null;
  return collaborator.role;
}

export async function requireBoardAccess(
  boardId: number,
  clerkId: string,
  minRole: "editor" | "viewer",
): Promise<BoardRole> {
  const role = await getBoardRole(boardId, clerkId);
  if (!role) {
    throw new Error("Board not found");
  }
  if (ROLE_RANK[role] < ROLE_RANK[minRole]) {
    throw new Error("Insufficient permissions");
  }
  return role;
}

export async function requireBoardOwnership(
  boardId: number,
  clerkId: string,
): Promise<void> {
  const role = await getBoardRole(boardId, clerkId);
  if (role !== "owner") {
    throw new Error("Board not found");
  }
}
