"use client";

import { useState } from "react";
import { ExternalLink, Lock, Wallet } from "lucide-react";
import { useFreighter } from "@/hooks/use-freighter";
import {
  buildVerifyUnlockTx,
  fundTestnetAccount,
  getAccountBalance,
  submitSignedTx,
} from "@/lib/stellar/contract";
import { txExplorerUrl } from "@/lib/stellar/config";
import { proveVaultUnlock } from "@/lib/vault/prover";
import { setVaultUnlocked } from "@/lib/vault/session";
import { Button } from "@/components/retroui/Button";
import { Dialog } from "@/components/retroui/Dialog";
import { Input } from "@/components/retroui/Input";
import { KaizenLoadingInline } from "@/components/loading/kaizen-loading";

type VaultUnlockDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  spaceId: number;
  spaceName: string;
  vaultSalt: string;
  vaultCommitment: string;
  onUnlocked: (txHash?: string) => void;
};

export function VaultUnlockDialog({
  open,
  onOpenChange,
  spaceId,
  spaceName,
  vaultSalt,
  vaultCommitment,
  onUnlocked,
}: VaultUnlockDialogProps) {
  const freighter = useFreighter();
  const [passphrase, setPassphrase] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);

  async function handleConnect() {
    setStatus("Connecting Freighter…");
    try {
      const addr = await freighter.connect();
      const balance = await getAccountBalance(addr);
      if (Number.parseFloat(balance) < 1) {
        setStatus("Funding testnet account…");
        await fundTestnetAccount(addr);
      }
      setStatus(null);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Wallet connection failed");
    }
  }

  async function handleUnlock(e: React.FormEvent) {
    e.preventDefault();
    if (!freighter.address) {
      setStatus("Connect Freighter first");
      return;
    }

    setLoading(true);
    setStatus("Generating ZK proof locally…");
    setTxHash(null);

    try {
      const proof = await proveVaultUnlock({
        vaultId: spaceId,
        passphrase,
        salt: vaultSalt,
        spaceName,
        expectedCommitment: vaultCommitment,
      });

      setStatus("Building Stellar transaction…");
      const xdr = await buildVerifyUnlockTx(
        freighter.address,
        spaceId,
        proof.commitment,
        proof.nullifier,
      );

      setStatus("Sign in Freighter…");
      const signed = await freighter.sign(xdr);

      setStatus("Submitting to Soroban testnet…");
      const result = await submitSignedTx(signed);

      setTxHash(result.hash);
      setVaultUnlocked(spaceId, result.hash);
      setStatus("Vault unlocked — verified on Stellar");
      onUnlocked(result.hash);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Unlock failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <Dialog.Content className="sm:max-w-md">
        <Dialog.Header asChild>
          <h2 className="flex items-center gap-2 font-head text-lg">
            <Lock className="size-5" />
            Unlock Secure Vault
          </h2>
        </Dialog.Header>

        <form onSubmit={(e) => void handleUnlock(e)} className="space-y-4 px-4 pb-4">
          <Dialog.Description>
            Prove vault access with a zero-knowledge proof verified on Stellar. Your
            passphrase never leaves this browser.
          </Dialog.Description>

          {!freighter.connected ? (
            <Button type="button" className="w-full" onClick={() => void handleConnect()}>
              <Wallet className="size-4" />
              Connect Freighter
            </Button>
          ) : (
            <p className="font-sans text-xs text-muted-foreground">
              Wallet: {freighter.address?.slice(0, 6)}…
              {freighter.address?.slice(-4)}
            </p>
          )}

          <div>
            <label className="mb-1.5 block font-head text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Vault Passphrase
            </label>
            <Input
              type="password"
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              placeholder="Enter vault passphrase"
              autoComplete="current-password"
            />
          </div>

          {loading ? <KaizenLoadingInline label={status ?? "Working…"} /> : null}
          {status && !loading ? (
            <p className="whitespace-pre-wrap font-sans text-sm text-muted-foreground">
              {status}
            </p>
          ) : null}

          {txHash ? (
            <a
              href={txExplorerUrl(txHash)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-sans text-xs text-primary underline"
            >
              View on Stellar Explorer
              <ExternalLink className="size-3" />
            </a>
          ) : null}

          <Dialog.Footer className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !freighter.connected}>
              {loading ? "Unlocking…" : "Prove & Unlock"}
            </Button>
          </Dialog.Footer>
        </form>
      </Dialog.Content>
    </Dialog>
  );
}
