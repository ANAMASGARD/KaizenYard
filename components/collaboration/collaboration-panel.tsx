"use client";

import { useCallback, useState } from "react";
import { Mail, UserPlus, Users, X } from "lucide-react";
import type {
  CollaboratorDisplayRecord,
  CollaboratorRole,
  CollaboratorsPanelData,
} from "@/lib/collaboration/types";
import { Avatar } from "@/components/retroui/Avatar";
import { KaizenLoadingInline } from "@/components/loading/kaizen-loading";
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
  entityId: number;
  title: string;
  ownerLabel: string;
  isOwner: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listCollaborators: (entityId: number) => Promise<CollaboratorsPanelData>;
  inviteCollaborator: (
    entityId: number,
    email: string,
    role: CollaboratorRole,
  ) => Promise<CollaboratorDisplayRecord>;
  updateCollaboratorRole: (
    collaboratorId: number,
    role: CollaboratorRole,
  ) => Promise<CollaboratorDisplayRecord>;
  removeCollaborator: (collaboratorId: number) => Promise<void>;
  editorRoleHint: string;
  viewerRoleHint: string;
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
  onRoleChange,
  onRemove,
}: {
  collaborator: CollaboratorDisplayRecord;
  isOwner: boolean;
  onRoleChange: (id: number, role: CollaboratorRole) => Promise<void>;
  onRemove: (id: number) => Promise<void>;
}) {
  const [saving, setSaving] = useState(false);

  async function handleRoleChange(role: CollaboratorRole) {
    setSaving(true);
    try {
      await onRoleChange(collaborator.id, role);
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
      await onRemove(collaborator.id);
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
  entityId,
  title,
  ownerLabel,
  isOwner,
  open,
  onOpenChange,
  listCollaborators,
  inviteCollaborator,
  updateCollaboratorRole,
  removeCollaborator,
  editorRoleHint,
  viewerRoleHint,
}: CollaborationPanelProps) {
  const [data, setData] = useState<CollaboratorsPanelData | null>(null);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<CollaboratorRole>("editor");
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCollaborators = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await listCollaborators(entityId);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load collaborators");
    } finally {
      setLoading(false);
    }
  }, [entityId, listCollaborators]);

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
      await inviteCollaborator(entityId, email, role);
      setEmail("");
      await loadCollaborators();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send invite");
    } finally {
      setInviting(false);
    }
  }

  async function handleRoleChange(id: number, nextRole: CollaboratorRole) {
    await updateCollaboratorRole(id, nextRole);
    await loadCollaborators();
  }

  async function handleRemove(id: number) {
    await removeCollaborator(id);
    await loadCollaborators();
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <Dialog.Content size="lg" className="max-w-lg">
        <Dialog.Header asChild>
          <div className="flex items-center gap-2">
            <Users className="size-5 text-violet-600" />
            <h2 className="font-head text-lg">{title}</h2>
          </div>
        </Dialog.Header>

        <div className="flex flex-col gap-4 p-4">
          {loading && !data ? (
            <KaizenLoadingInline label="Loading" className="py-6" />
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
                    {data.ownerName ?? ownerLabel}
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
                      onRoleChange={handleRoleChange}
                      onRemove={handleRemove}
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
                  <option value="editor">{editorRoleHint}</option>
                  <option value="viewer">{viewerRoleHint}</option>
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
