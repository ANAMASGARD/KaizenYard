"use client";

import { useState, type ChangeEvent } from "react";
import { Shield } from "lucide-react";
import { toast } from "sonner";
import type { GeneratedAppRecord } from "@/lib/templates/types";
import { generateAppShareProof } from "@/lib/templates/zk-share/prover";
import { clearAppShareUnlocked, isAppShareUnlocked, setAppShareUnlocked } from "@/lib/templates/zk-share/session";
import { verifyAppSharePassphrase } from "@/lib/templates/zk-share/commitment";
import { verifyAppShareOnChain } from "@/lib/templates/zk-share/contract";
import { useFreighter } from "@/hooks/use-freighter";
import { DynamicAppRenderer } from "@/components/templates/dynamic-app-renderer";
import { Button } from "@/components/retroui/Button";
import { Card } from "@/components/retroui/Card";
import { Input } from "@/components/retroui/Input";

type SharedAppViewProps = {
  app: GeneratedAppRecord;
};

export function SharedAppView({ app }: SharedAppViewProps) {
  const freighter = useFreighter();
  const [passphrase, setPassphrase] = useState("");
  const [unlocked, setUnlocked] = useState(isAppShareUnlocked(app.id));
  const [busy, setBusy] = useState(false);

  const needsZkUnlock = app.isZkShare && app.shareCommitment && app.shareSalt;

  const unlock = async () => {
    if (!needsZkUnlock) {
      setUnlocked(true);
      return;
    }

    setBusy(true);
    try {
      const localValid = verifyAppSharePassphrase({
        passphrase,
        salt: app.shareSalt!,
        appLabel: app.appName,
        expectedCommitment: app.shareCommitment!,
      });

      if (!localValid) {
        throw new Error("Incorrect share passphrase");
      }

      if (freighter.connected && freighter.address) {
        const proof = await generateAppShareProof({
          appId: app.id,
          passphrase,
          salt: app.shareSalt!,
          appName: app.appName,
          expectedCommitment: app.shareCommitment!,
        });
        await verifyAppShareOnChain({
          sourceAddress: freighter.address,
          appId: app.id,
          commitment: proof.commitment,
          nullifier: proof.nullifier,
          sign: freighter.sign,
        });
      }

      setAppShareUnlocked(app.id);
      setUnlocked(true);
      toast.success("Shared app unlocked");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unlock failed");
    } finally {
      setBusy(false);
    }
  };

  if (!unlocked && needsZkUnlock) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Card className="block w-full border-2 border-border p-6 shadow-md">
          <div className="mb-4 flex items-center gap-3">
            <Shield className="size-5" />
            <div>
              <h1 className="font-head text-xl">Protected Shared App</h1>
              <p className="text-sm text-muted-foreground">
                This app uses a privacy-friendly Stellar share gate.
              </p>
            </div>
          </div>
          <div className="space-y-3">
            <Input
              type="password"
              value={passphrase}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                setPassphrase(event.target.value)
              }
              placeholder="Enter share passphrase"
            />
            <div className="flex flex-wrap gap-2">
              {!freighter.connected ? (
                <Button variant="outline" onClick={() => void freighter.connect()}>
                  Connect Freighter
                </Button>
              ) : null}
              <Button onClick={() => void unlock()} disabled={busy || !passphrase.trim()}>
                Unlock Shared App
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-head text-sm uppercase tracking-[0.2em] text-muted-foreground">
            Shared App
          </p>
          <h1 className="font-head text-2xl">{app.appName}</h1>
        </div>
        {needsZkUnlock ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              clearAppShareUnlocked(app.id);
              setUnlocked(false);
            }}
          >
            Lock
          </Button>
        ) : null}
      </div>

      <DynamicAppRenderer
        definition={app.definition}
        runtimeState={app.runtimeState}
        readOnly
      />
    </div>
  );
}
