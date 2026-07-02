"use client";

import { useEffect, useState } from "react";
import { Lock } from "lucide-react";
import type { KanbanColor } from "@/lib/kanban/colors";
import type { SpaceRecord } from "@/lib/pages/types";
import { computeVaultCommitment } from "@/lib/vault/commitment";
import { ColorSwatchPicker } from "@/components/kanban/color-swatch-picker";
import { Button } from "@/components/retroui/Button";
import { Dialog } from "@/components/retroui/Dialog";
import { Input } from "@/components/retroui/Input";

type SpaceDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  initial?: Partial<SpaceRecord>;
  onSubmit: (values: {
    name: string;
    description: string;
    color: KanbanColor;
    isVault: boolean;
    vaultPassphrase?: string;
    vaultCommitment?: string;
    vaultSalt?: string;
  }) => Promise<void>;
};

export function SpaceDialog({
  open,
  onOpenChange,
  mode,
  initial,
  onSubmit,
}: SpaceDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState<KanbanColor>("yellow");
  const [isVault, setIsVault] = useState(false);
  const [passphrase, setPassphrase] = useState("");
  const [confirmPassphrase, setConfirmPassphrase] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName(initial?.name ?? "");
    setDescription(initial?.description ?? "");
    setColor(initial?.color ?? "yellow");
    setIsVault(initial?.isVault ?? false);
    setPassphrase("");
    setConfirmPassphrase("");
    setError(null);
  }, [open, initial]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Name is required");
      return;
    }

    if (mode === "create" && isVault) {
      if (passphrase.length < 8) {
        setError("Vault passphrase must be at least 8 characters");
        return;
      }
      if (passphrase !== confirmPassphrase) {
        setError("Passphrases do not match");
        return;
      }
    }

    setSubmitting(true);
    try {
      let vaultCommitment: string | undefined;
      let vaultSalt: string | undefined;

      if (mode === "create" && isVault) {
        const { commitment, salt } = await computeVaultCommitment(
          passphrase,
          trimmedName,
        );
        vaultCommitment = commitment;
        vaultSalt = salt;
      }

      await onSubmit({
        name: trimmedName,
        description: description.trim(),
        color,
        isVault: mode === "create" ? isVault : (initial?.isVault ?? false),
        vaultPassphrase: isVault ? passphrase : undefined,
        vaultCommitment,
        vaultSalt,
      });
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save space");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <Dialog.Content className="sm:max-w-md">
        <Dialog.Header asChild>
          <h2 className="font-head text-lg">
            {mode === "create" ? "Create New Space" : "Edit Space"}
          </h2>
        </Dialog.Header>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4 px-4 pb-4">
          <Dialog.Description>
            Organize pages into a workspace. Enable Secure Vault for ZK-gated
            access on Stellar.
          </Dialog.Description>

          <div>
            <label className="mb-1.5 block font-head text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Name
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Productivity Hub"
            />
          </div>
          <div>
            <label className="mb-1.5 block font-head text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Description
            </label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional short description"
            />
          </div>
          <div>
            <label className="mb-1.5 block font-head text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Color
            </label>
            <ColorSwatchPicker value={color} onChange={setColor} />
          </div>

          {mode === "create" ? (
            <label className="flex cursor-pointer items-start gap-3 rounded border-2 border-border bg-muted/30 p-3 shadow-sm">
              <input
                type="checkbox"
                checked={isVault}
                onChange={(e) => setIsVault(e.target.checked)}
                className="mt-1"
              />
              <span>
                <span className="flex items-center gap-1.5 font-head text-sm">
                  <Lock className="size-4" />
                  Secure Vault
                </span>
                <span className="mt-1 block font-sans text-xs text-muted-foreground">
                  ZK proof required to unlock. Passphrase never leaves your browser.
                </span>
              </span>
            </label>
          ) : null}

          {mode === "create" && isVault ? (
            <>
              <div>
                <label className="mb-1.5 block font-head text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  Vault Passphrase
                </label>
                <Input
                  type="password"
                  value={passphrase}
                  onChange={(e) => setPassphrase(e.target.value)}
                  placeholder="Min 8 characters"
                  autoComplete="new-password"
                />
              </div>
              <div>
                <label className="mb-1.5 block font-head text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  Confirm Passphrase
                </label>
                <Input
                  type="password"
                  value={confirmPassphrase}
                  onChange={(e) => setConfirmPassphrase(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
            </>
          ) : null}

          {error ? (
            <p className="font-sans text-sm text-destructive">{error}</p>
          ) : null}

          <Dialog.Footer className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving…" : mode === "create" ? "Create Space" : "Save"}
            </Button>
          </Dialog.Footer>
        </form>
      </Dialog.Content>
    </Dialog>
  );
}
