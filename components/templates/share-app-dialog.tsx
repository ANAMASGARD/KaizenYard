"use client";

import { useMemo, useState, type ChangeEvent } from "react";
import { Copy, Shield, Share2 } from "lucide-react";
import { toast } from "sonner";
import {
  listGeneratedAppCollaborators,
  inviteGeneratedAppCollaborator,
  removeGeneratedAppCollaborator,
} from "@/lib/templates/collaboration-actions";
import { updateGeneratedAppShareSettings } from "@/lib/templates/actions";
import { computeAppShareCommitment } from "@/lib/templates/zk-share/commitment";
import { registerAppShareCommitment } from "@/lib/templates/zk-share/contract";
import { useFreighter } from "@/hooks/use-freighter";
import type { GeneratedAppRecord } from "@/lib/templates/types";
import { Button } from "@/components/retroui/Button";
import { Dialog } from "@/components/retroui/Dialog";
import { Input } from "@/components/retroui/Input";
import { Select } from "@/components/retroui/Select";
import { Switch } from "@/components/retroui/Switch";

type ShareableGeneratedApp = Pick<
  GeneratedAppRecord,
  | "id"
  | "appName"
  | "shareToken"
  | "shareEnabled"
  | "shareMode"
  | "isZkShare"
> & {
  shareCommitment?: string | null;
  shareSalt?: string | null;
  shareNullifierRoot?: string | null;
};

type ShareAppDialogProps = {
  app: ShareableGeneratedApp;
  trigger?: React.ReactNode;
  onUpdated?: (app: GeneratedAppRecord) => void;
};

export function ShareAppDialog({
  app,
  trigger,
  onUpdated,
}: ShareAppDialogProps) {
  const freighter = useFreighter();
  const [open, setOpen] = useState(false);
  const [shareEnabled, setShareEnabled] = useState(app.shareEnabled);
  const [shareMode, setShareMode] = useState<GeneratedAppRecord["shareMode"]>(
    app.shareMode,
  );
  const [isZkShare, setIsZkShare] = useState(app.isZkShare);
  const [sharePassphrase, setSharePassphrase] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"editor" | "viewer">("viewer");
  const [busy, setBusy] = useState(false);
  const [collaborators, setCollaborators] = useState<
    Awaited<ReturnType<typeof listGeneratedAppCollaborators>>["collaborators"]
  >([]);

  const shareUrl = useMemo(() => {
    if (!app.shareToken) return "";
    if (typeof window === "undefined") return `/templates/share/${app.shareToken}`;
    return `${window.location.origin}/templates/share/${app.shareToken}`;
  }, [app.shareToken]);

  const loadCollaborators = async () => {
    try {
      const data = await listGeneratedAppCollaborators(app.id);
      setCollaborators(data.collaborators);
    } catch {
      setCollaborators([]);
    }
  };

  const saveSettings = async () => {
    setBusy(true);
    try {
      let shareCommitment = app.shareCommitment;
      let shareSalt = app.shareSalt;
      let shareNullifierRoot = app.shareNullifierRoot;

      if (isZkShare && sharePassphrase.trim()) {
        const zk = await computeAppShareCommitment(
          sharePassphrase.trim(),
          app.appName,
          app.id,
        );
        shareCommitment = zk.commitment;
        shareSalt = zk.salt;
        shareNullifierRoot = zk.nullifierRoot;

        if (freighter.address) {
          await registerAppShareCommitment({
            sourceAddress: freighter.address,
            appId: app.id,
            commitment: zk.commitment,
            sign: freighter.sign,
          });
        }
      }

      const updated = await updateGeneratedAppShareSettings({
        appId: app.id,
        shareEnabled,
        shareMode,
        isZkShare,
        shareCommitment,
        shareSalt,
        shareNullifierRoot,
      });

      onUpdated?.(updated);
      toast.success("Share settings updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Share update failed");
    } finally {
      setBusy(false);
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setBusy(true);
    try {
      const collaborator = await inviteGeneratedAppCollaborator(
        app.id,
        inviteEmail,
        inviteRole,
      );
      setCollaborators((current) => [...current, collaborator]);
      setInviteEmail("");
      toast.success("Collaborator invited");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Invite failed");
    } finally {
      setBusy(false);
    }
  };

  const removeInvite = async (collaboratorId: number) => {
    setBusy(true);
    try {
      await removeGeneratedAppCollaborator(collaboratorId);
      setCollaborators((current) =>
        current.filter((collaborator) => collaborator.id !== collaboratorId),
      );
      toast.success("Collaborator removed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Remove failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (nextOpen) {
          void loadCollaborators();
        }
      }}
    >
      {trigger ? <Dialog.Trigger render={trigger as React.ReactElement} /> : null}
      <Dialog.Content size="lg" className="max-w-2xl">
        <Dialog.Header asChild>
          <h2 className="font-head text-lg">Share {app.appName}</h2>
        </Dialog.Header>

        <div className="space-y-5">
          <div className="flex items-center justify-between rounded border-2 border-border p-3">
            <div>
              <p className="font-head text-sm uppercase tracking-[0.15em]">
                Enable sharing
              </p>
              <p className="text-sm text-muted-foreground">
                Create a public link or invite collaborators.
              </p>
            </div>
            <Switch
              checked={shareEnabled}
              onCheckedChange={(checked) => setShareEnabled(checked === true)}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block font-head text-sm">Share Mode</label>
              <Select
                value={shareMode}
                onValueChange={(value) =>
                  setShareMode((value ?? "private") as GeneratedAppRecord["shareMode"])
                }
              >
                <Select.Trigger className="w-full min-w-0">
                  <Select.Value />
                </Select.Trigger>
                <Select.Content>
                  <Select.Item value="private">Private</Select.Item>
                  <Select.Item value="link">Public Link</Select.Item>
                  <Select.Item value="collaborators">Collaborators</Select.Item>
                </Select.Content>
              </Select>
            </div>

            <div className="flex items-center justify-between rounded border-2 border-border p-3">
              <div>
                <p className="font-head text-sm uppercase tracking-[0.15em]">
                  ZK-gated share
                </p>
                <p className="text-sm text-muted-foreground">
                  Use Stellar + passphrase protection.
                </p>
              </div>
              <Switch
                checked={isZkShare}
                onCheckedChange={(checked) => setIsZkShare(checked === true)}
              />
            </div>
          </div>

          {shareEnabled && shareMode !== "private" ? (
            <div>
              <label className="mb-1.5 block font-head text-sm">Public link</label>
              <div className="flex gap-2">
                <Input value={shareUrl} readOnly placeholder="Save settings to generate link" />
                <Button
                  variant="outline"
                  onClick={() => {
                    if (!shareUrl) return;
                    void navigator.clipboard.writeText(shareUrl);
                    toast.success("Link copied");
                  }}
                >
                  <Copy className="size-4" />
                </Button>
              </div>
            </div>
          ) : null}

          {isZkShare ? (
            <div>
              <label className="mb-1.5 block font-head text-sm">Share passphrase</label>
              <Input
                type="password"
                value={sharePassphrase}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  setSharePassphrase(event.target.value)
                }
                placeholder="Create a private unlock phrase"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                If your Freighter wallet is connected and the share verifier contract is configured,
                saving will register the share commitment on Stellar testnet.
              </p>
            </div>
          ) : null}

          <div className="space-y-3 rounded border-2 border-border p-4">
            <div className="flex items-center gap-2">
              <Share2 className="size-4" />
              <p className="font-head text-sm uppercase tracking-[0.15em]">
                Collaborators
              </p>
            </div>
            <div className="grid gap-3 md:grid-cols-[1fr_180px_auto]">
              <Input
                value={inviteEmail}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  setInviteEmail(event.target.value)
                }
                placeholder="name@example.com"
              />
              <Select
                value={inviteRole}
                onValueChange={(value) =>
                  setInviteRole((value ?? "viewer") as "editor" | "viewer")
                }
              >
                <Select.Trigger className="w-full min-w-0">
                  <Select.Value />
                </Select.Trigger>
                <Select.Content>
                  <Select.Item value="viewer">Viewer</Select.Item>
                  <Select.Item value="editor">Editor</Select.Item>
                </Select.Content>
              </Select>
              <Button onClick={() => void handleInvite()} disabled={busy}>
                Invite
              </Button>
            </div>
            <ul className="space-y-2">
              {collaborators.map((collaborator) => (
                <li
                  key={collaborator.id}
                  className="flex items-center justify-between rounded border-2 border-border px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium">{collaborator.displayEmail}</p>
                    <p className="text-xs text-muted-foreground">
                      {collaborator.role} {collaborator.isPending ? "· pending" : ""}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void removeInvite(collaborator.id)}
                  >
                    Remove
                  </Button>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void saveSettings()} disabled={busy}>
              <Shield className="size-4" />
              Save Sharing
            </Button>
          </div>
        </div>
      </Dialog.Content>
    </Dialog>
  );
}
