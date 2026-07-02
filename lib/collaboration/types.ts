export type CollaboratorRole = "editor" | "viewer";
export type EntityRole = "owner" | "editor" | "viewer";

export const ROLE_RANK: Record<EntityRole, number> = {
  viewer: 0,
  editor: 1,
  owner: 2,
};

export function isCollaboratorRole(value: string): value is CollaboratorRole {
  return value === "editor" || value === "viewer";
}

export function hasMinRole(
  role: EntityRole,
  minRole: "editor" | "viewer",
): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[minRole];
}

export type CollaboratorDisplayRecord = {
  id: number;
  email: string;
  clerkId: string | null;
  role: CollaboratorRole;
  invitedByClerkId: string;
  acceptedAt: string | null;
  displayName: string | null;
  displayEmail: string;
  isPending: boolean;
};

export type CollaboratorsPanelData = {
  ownerClerkId: string;
  ownerName: string | null;
  ownerEmail: string;
  collaborators: CollaboratorDisplayRecord[];
};
