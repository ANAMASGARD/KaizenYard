"use client";

import { Shield } from "lucide-react";
import { txExplorerUrl } from "@/lib/stellar/config";
import { cn } from "@/lib/utils";

type WitnessBadgeProps = {
  txHash?: string | null;
  className?: string;
};

export function WitnessBadge({ txHash, className }: WitnessBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 border-2 border-border bg-violet-100 px-2 py-0.5 font-head text-[10px] uppercase tracking-wider text-violet-800 shadow-sm dark:bg-violet-950 dark:text-violet-200",
        className,
      )}
    >
      <Shield className="size-3" aria-hidden />
      Verified Anonymous
      {txHash ? (
        <a
          href={txExplorerUrl(txHash)}
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          tx
        </a>
      ) : null}
    </span>
  );
}
