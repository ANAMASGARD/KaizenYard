"use client";

import { useEffect, useState } from "react";
import { Lock } from "lucide-react";
import { VaultUnlockDialog } from "@/components/pages/vault-unlock-dialog";
import { Button } from "@/components/retroui/Button";
import { useFreighter } from "@/hooks/use-freighter";
import { listVaultSpacesForAssistant, type VaultSpaceUnlockInfo } from "@/lib/assistant/vault-spaces";
import { setAssistantVaultUnlocked } from "@/lib/assistant/witness/session";
import { cn } from "@/lib/utils";

type VaultGateBannerProps = {
  onUnlocked?: () => void;
  className?: string;
};

export function VaultGateBanner({ onUnlocked, className }: VaultGateBannerProps) {
  const { connected, connect, installed } = useFreighter();
  const [vaultSpaces, setVaultSpaces] = useState<VaultSpaceUnlockInfo[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    void listVaultSpacesForAssistant().then((spaces) => {
      setVaultSpaces(spaces);
      if (spaces[0]) {
        setSelectedId(spaces[0].id);
      }
    });
  }, []);

  const selected = vaultSpaces.find((s) => s.id === selectedId) ?? null;

  function handleUnlocked() {
    if (selectedId) {
      setAssistantVaultUnlocked(selectedId);
      onUnlocked?.();
    }
    setDialogOpen(false);
  }

  return (
    <>
      <div
        className={cn(
          "flex flex-wrap items-center justify-between gap-3 border-2 border-border bg-violet-50 p-3 shadow-sm dark:bg-violet-950/30",
          className,
        )}
      >
        <div className="flex items-center gap-2">
          <Lock className="size-4 text-violet-600" aria-hidden />
          <p className="font-sans text-sm">
            Vault Witness — unlock a secure space with Freighter + ZK proof before the agent reads it.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!installed ? (
            <span className="font-sans text-xs text-muted-foreground">Install Freighter wallet</span>
          ) : !connected ? (
            <Button type="button" variant="outline" size="sm" onClick={() => void connect()}>
              Connect Freighter
            </Button>
          ) : vaultSpaces.length === 0 ? (
            <span className="font-sans text-xs text-muted-foreground">
              No vault spaces — create one in Pages &amp; Spaces
            </span>
          ) : (
            <>
              <select
                className="border-2 border-border bg-background px-2 py-1 font-sans text-xs"
                value={selectedId ?? ""}
                onChange={(e) => setSelectedId(Number(e.target.value))}
              >
                {vaultSpaces.map((space) => (
                  <option key={space.id} value={space.id}>
                    {space.name}
                  </option>
                ))}
              </select>
              <Button
                type="button"
                variant="default"
                size="sm"
                disabled={!selected}
                onClick={() => setDialogOpen(true)}
              >
                Unlock vault
              </Button>
            </>
          )}
        </div>
      </div>

      {selected ? (
        <VaultUnlockDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          spaceId={selected.id}
          spaceName={selected.name}
          vaultSalt={selected.vaultSalt}
          vaultCommitment={selected.vaultCommitment}
          onUnlocked={handleUnlocked}
        />
      ) : null}
    </>
  );
}
