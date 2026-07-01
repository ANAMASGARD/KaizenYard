"use client";

import { useCallback, useState } from "react";
import { Mail, UserPlus, Users, X } from "lucide-react";
import {
  inviteCollaborator,
  listBoardCollaborators,
  removeCollaborator,
  updateCollaboratorRole,
  type BoardCollaboratorsData,
  type CollaboratorRecord,
} from "@/lib/kanban/collaboration-actions";
import type { CollaboratorRole } from "@/lib/kanban/room";
import { Avatar } from "@/components/retroui/Avatar";
import { Button } from "@/components/retroui/Button";
import { Dialog } from "@/components/retroui/Dialog";
import { Input } from "@/components/retroui/Input";
import {
  bgClassForUserId,
  initialsForName,
} from "@/lib/liveblocks/user-color";
import { cn } from "@/lib/utils";

const fieldLabelClass =
  "font-head text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70";

type CollaborationPanelProps = {
  boardId: number;
  isOwner: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function MemberAvatar({
  label,
  userId,
}: {
  label: string;
  userId: string;
}) {
  return (
    <Avatar
      className={cn("size-9 border-2 border-border", bgClassForUserId(userId))}
    >
      <Avatar.Fallback className="font-head text-[10px]">
        {initialsForName(label)}
      </Avatar.Fallback>
    </Avatar>
  );
}

function CollaboratorRow({
  collaborator,
  isOwner,
  onChanged,
}: {
  collaborator: CollaboratorRecord;
  isOwner: boolean;
  onChanged: () => void;
}) {
  const [saving, setSaving] = useState(false);

  async function handleRoleChange(role: CollaboratorRole) {
    setSaving(true);
    try {
      await updateCollaboratorRole(collaborator.id, role);
      onChanged();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update role");
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove() {
    if (!confirm("Remove this collaborator?")) return;
    setSaving(true);
    try {
      await removeCollaborator(collaborator.id);
      onChanged();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to remove collaborator");
    } finally {
      setSaving(false);
    }
  }

  const displayLabel = collaborator.displayName ?? collaborator.displayEmail;

  return (
    <div className="flex items-center gap-3 rounded border-2 border-border bg-background p-3 shadow-sm">
      <MemberAvatar
        label={displayLabel}
        userId={collaborator.clerkId ?? collaborator.email}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate font-head text-sm">
          {collaborator.displayName ?? "Invited user"}
        </p>
        <p className="truncate font-sans text-xs text-muted-foreground">
          {collaborator.displayEmail}
        </p>
        {collaborator.isPending ? (
          <span className="mt-1 inline-flex rounded border border-amber-600 bg-amber-100 px-1.5 py-0.5 font-head text-[10px] uppercase tracking-wide text-amber-900 dark:bg-amber-950 dark:text-amber-100">
            Invited
          </span>
        ) : null}
      </div>
      {isOwner ? (
        <div className="flex items-center gap-2">
          <select
            value={collaborator.role}
            disabled={saving}
            onChange={(e) =>
              void handleRoleChange(e.target.value as CollaboratorRole)
            }
            className="rounded border-2 border-border px-2 py-1 font-sans text-xs shadow-sm"
          >
            <option value="editor">Editor</option>
            <option value="viewer">Viewer</option>
          </select>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 px-2"
            disabled={saving}
            onClick={() => void handleRemove()}
            aria-label="Remove collaborator"
          >
            <X className="size-4" />
          </Button>
        </div>
      ) : (
        <span className="rounded border border-border px-2 py-1 font-head text-[10px] uppercase tracking-wide">
          {collaborator.role}
        </span>
      )}
    </div>
  );
}

export function CollaborationPanel({
  boardId,
  isOwner,
  open,
  onOpenChange,
}: CollaborationPanelProps) {
  const [data, setData] = useState<BoardCollaboratorsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<CollaboratorRole>("editor");
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCollaborators = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await listBoardCollaborators(boardId);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load collaborators");
    } finally {
      setLoading(false);
    }
  }, [boardId]);

  function handleOpenChange(next: boolean) {
    onOpenChange(next);
    if (next) {
      void loadCollaborators();
    }
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setInviting(true);
    setError(null);
    try {
      await inviteCollaborator(boardId, email, role);
      setEmail("");
      await loadCollaborators();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send invite");
    } finally {
      setInviting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <Dialog.Content size="lg" className="max-w-lg">
        <Dialog.Header asChild>
          <div className="flex items-center gap-2">
            <Users className="size-5 text-violet-600" />
            <h2 className="font-head text-lg">Collaboration</h2>
          </div>
        </Dialog.Header>

        <div className="flex flex-col gap-4 p-4">
          {loading && !data ? (
            <p className="font-sans text-sm text-muted-foreground">Loading…</p>
          ) : null}

          {data ? (
            <>
              <div className="flex items-center gap-3 rounded border-2 border-border bg-primary/20 p-3 shadow-sm">
                <MemberAvatar
                  label={data.ownerName ?? data.ownerEmail}
                  userId={data.ownerClerkId}
                />
                <div className="min-w-0 flex-1">
                  <p className="font-head text-sm">
                    {data.ownerName ?? "Board owner"}
                  </p>
                  <p className="font-sans text-xs text-muted-foreground">
                    {data.ownerEmail}
                  </p>
                </div>
                <span className="rounded border border-border bg-primary px-2 py-1 font-head text-[10px] uppercase tracking-wide">
                  Owner
                </span>
              </div>

              {data.collaborators.length === 0 ? (
                <p className="rounded border-2 border-dashed border-border p-4 text-center font-sans text-sm text-muted-foreground">
                  No collaborators yet.
                  {isOwner ? " Invite someone by email to get started." : null}
                </p>
              ) : (
                <div className="flex max-h-64 flex-col gap-2 overflow-y-auto">
                  {data.collaborators.map((collaborator) => (
                    <CollaboratorRow
                      key={collaborator.id}
                      collaborator={collaborator}
                      isOwner={isOwner}
                      onChanged={() => void loadCollaborators()}
                    />
                  ))}
                </div>
              )}
            </>
          ) : null}

          {isOwner ? (
            <form
              onSubmit={handleInvite}
              className="space-y-3 rounded border-2 border-border bg-muted/20 p-3"
            >
              <p className="font-head text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Invite by email
              </p>
              <div className="space-y-2">
                <label htmlFor="collab-email" className={fieldLabelClass}>
                  Email
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="collab-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="teammate@example.com"
                    className="pl-9"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="collab-role" className={fieldLabelClass}>
                  Role
                </label>
                <select
                  id="collab-role"
                  value={role}
                  onChange={(e) => setRole(e.target.value as CollaboratorRole)}
                  className="w-full rounded border-2 border-border px-3 py-2 font-sans text-sm shadow-sm"
                >
                  <option value="editor">Editor — can edit tasks and columns</option>
                  <option value="viewer">Viewer — read-only access</option>
                </select>
              </div>
              <Button type="submit" disabled={inviting || !email.trim()}>
                <UserPlus className="size-4" />
                {inviting ? "Inviting…" : "Send invite"}
              </Button>
            </form>
          ) : null}

          {error ? (
            <p className="font-sans text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          ) : null}
        </div>
      </Dialog.Content>
    </Dialog>
  );
}
