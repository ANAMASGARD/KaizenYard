import Link from "next/link";
import { Lock, Shield } from "lucide-react";
import type { DashboardWeb3Status } from "@/lib/dashboard/types";
import { contractExplorerUrl } from "@/lib/stellar/config";
import { Card } from "@/components/retroui/Card";
import { Badge } from "@/components/retroui/Badge";

type DashboardWeb3StripProps = {
  web3: DashboardWeb3Status;
};

export function DashboardWeb3Strip({ web3 }: DashboardWeb3StripProps) {
  const hasContracts = Boolean(web3.vaultContractId || web3.witnessContractId);
  if (!hasContracts) return null;

  return (
    <Card className="block w-full border-2 border-violet-300 bg-violet-50 p-4 shadow-md dark:border-violet-800 dark:bg-violet-950/30">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Shield className="mt-0.5 size-5 shrink-0 text-violet-600" aria-hidden />
          <div>
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <h2 className="font-head text-sm font-semibold">Stellar Web3</h2>
              <Badge className="font-sans text-[10px] uppercase">
                {web3.networkLabel}
              </Badge>
            </div>
            <p className="max-w-xl font-sans text-sm text-muted-foreground">
              ZK Secure Vaults and Kaizen Witness attestations run on Soroban testnet.
              {web3.vaultSpaceCount > 0
                ? ` You have ${web3.vaultSpaceCount} vault space${web3.vaultSpaceCount === 1 ? "" : "s"}.`
                : " Create a vault space in Pages to try on-chain unlock."}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {web3.vaultContractId ? (
            <Link
              href={contractExplorerUrl(web3.vaultContractId)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 border-2 border-border bg-background px-3 py-1.5 font-sans text-xs shadow-sm hover:bg-muted/30"
            >
              <Lock className="size-3.5" aria-hidden />
              Vault contract
            </Link>
          ) : null}
          {web3.witnessContractId ? (
            <Link
              href={contractExplorerUrl(web3.witnessContractId)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 border-2 border-border bg-background px-3 py-1.5 font-sans text-xs shadow-sm hover:bg-muted/30"
            >
              <Shield className="size-3.5" aria-hidden />
              Witness contract
            </Link>
          ) : null}
          <Link
            href="/pages"
            className="inline-flex items-center gap-1.5 border-2 border-border bg-primary px-3 py-1.5 font-head text-xs shadow-sm"
          >
            Pages &amp; Vaults
          </Link>
          <Link
            href="/assistant?mode=witness"
            className="inline-flex items-center gap-1.5 border-2 border-border bg-background px-3 py-1.5 font-sans text-xs shadow-sm hover:bg-muted/30"
          >
            Witness mode
          </Link>
        </div>
      </div>
    </Card>
  );
}
