"use client";

import { Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

type DelegateWalletChipProps = {
  address: string | null;
  className?: string;
};

export function DelegateWalletChip({ address, className }: DelegateWalletChipProps) {
  if (!address) return null;
  const short = `${address.slice(0, 4)}…${address.slice(-4)}`;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 border-2 border-border bg-background px-2 py-1 font-mono text-xs shadow-sm",
        className,
      )}
    >
      <Wallet className="size-3.5 text-blue-600" aria-hidden />
      {short}
    </span>
  );
}
