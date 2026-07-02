import { and, eq, isNotNull } from "drizzle-orm";
import { db, pages, spaceCollaborators, spaces } from "@/db";
import { hasMinRole } from "@/lib/collaboration/types";
import {
  isCollaboratorRole,
  type SpaceRole,
} from "@/lib/pages/room";

export type { SpaceRole, CollaboratorRole } from "@/lib/pages/room";

export async function getSpaceRole(
  spaceId: number,
  clerkId: string,
): Promise<SpaceRole | null> {
  const [space] = await db
    .select()
    .from(spaces)
    .where(eq(spaces.id, spaceId))
    .limit(1);

  if (!space) return null;

  if (space.deletedAt !== null && space.clerkId !== clerkId) {
    return null;
  }

  if (space.clerkId === clerkId) return "owner";

  const [collaborator] = await db
    .select()
    .from(spaceCollaborators)
    .where(
      and(
        eq(spaceCollaborators.spaceId, spaceId),
        eq(spaceCollaborators.clerkId, clerkId),
        isNotNull(spaceCollaborators.acceptedAt),
      ),
    )
    .limit(1);

  if (!collaborator) return null;
  if (!isCollaboratorRole(collaborator.role)) return null;
  return collaborator.role;
}

export async function getPageRole(
  pageId: number,
  clerkId: string,
): Promise<SpaceRole | null> {
  const [page] = await db
    .select()
    .from(pages)
    .where(eq(pages.id, pageId))
    .limit(1);

  if (!page) return null;

  return getSpaceRole(page.spaceId, clerkId);
}

export async function requireSpaceAccess(
  spaceId: number,
  clerkId: string,
  minRole: "editor" | "viewer",
): Promise<SpaceRole> {
  const role = await getSpaceRole(spaceId, clerkId);
  if (!role) {
    throw new Error("Space not found");
  }
  if (!hasMinRole(role, minRole)) {
    throw new Error("Insufficient permissions");
  }
  return role;
}

export async function requireSpaceOwnership(
  spaceId: number,
  clerkId: string,
): Promise<void> {
  const role = await getSpaceRole(spaceId, clerkId);
  if (role !== "owner") {
    throw new Error("Space not found");
  }
}

export async function requirePageAccess(
  pageId: number,
  clerkId: string,
  minRole: "editor" | "viewer",
): Promise<SpaceRole> {
  const role = await getPageRole(pageId, clerkId);
  if (!role) {
    throw new Error("Page not found");
  }
  if (!hasMinRole(role, minRole)) {
    throw new Error("Insufficient permissions");
  }
  return role;
}

export async function requirePageOwnership(
  pageId: number,
  clerkId: string,
): Promise<void> {
  const [page] = await db
    .select()
    .from(pages)
    .where(eq(pages.id, pageId))
    .limit(1);

  if (!page || page.clerkId !== clerkId) {
    throw new Error("Page not found");
  }
}
