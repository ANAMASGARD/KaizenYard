import { and, eq, isNotNull } from "drizzle-orm";
import { db, generatedAppCollaborators, generatedApps } from "@/db";
import { hasMinRole, isCollaboratorRole, type EntityRole } from "@/lib/collaboration/types";

export type GeneratedAppRole = EntityRole;
export type { CollaboratorRole } from "@/lib/collaboration/types";

export async function getGeneratedAppRole(
  appId: number,
  clerkId: string,
): Promise<GeneratedAppRole | null> {
  const [app] = await db
    .select()
    .from(generatedApps)
    .where(eq(generatedApps.id, appId))
    .limit(1);

  if (!app) return null;
  if (app.clerkId === clerkId) return "owner";

  const [collaborator] = await db
    .select()
    .from(generatedAppCollaborators)
    .where(
      and(
        eq(generatedAppCollaborators.appId, appId),
        eq(generatedAppCollaborators.clerkId, clerkId),
        isNotNull(generatedAppCollaborators.acceptedAt),
      ),
    )
    .limit(1);

  if (!collaborator || !isCollaboratorRole(collaborator.role)) {
    return null;
  }

  return collaborator.role;
}

export async function requireGeneratedAppAccess(
  appId: number,
  clerkId: string,
  minRole: "editor" | "viewer",
): Promise<GeneratedAppRole> {
  const role = await getGeneratedAppRole(appId, clerkId);
  if (!role) {
    throw new Error("App not found");
  }
  if (!hasMinRole(role, minRole)) {
    throw new Error("Insufficient permissions");
  }
  return role;
}

export async function requireGeneratedAppOwnership(
  appId: number,
  clerkId: string,
): Promise<void> {
  const [app] = await db
    .select()
    .from(generatedApps)
    .where(eq(generatedApps.id, appId))
    .limit(1);

  if (!app || app.clerkId !== clerkId) {
    throw new Error("App not found");
  }
}

export async function getGeneratedAppByShareToken(token: string) {
  const [app] = await db
    .select()
    .from(generatedApps)
    .where(eq(generatedApps.shareToken, token))
    .limit(1);

  if (!app || !app.shareEnabled) {
    return null;
  }

  return app;
}
