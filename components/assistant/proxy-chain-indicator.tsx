"use client";

import { cn } from "@/lib/utils";

const HOPS = ["Scrub", "Shroud", "Blind", "Rehydrate", "Anchor"] as const;

type ProxyChainIndicatorProps = {
  activeHop?: number;
  className?: string;
};

export function ProxyChainIndicator({ activeHop = 0, className }: ProxyChainIndicatorProps) {
  return (
    <div className={cn("flex items-center gap-1", className)} aria-label="Privacy proxy chain">
      {HOPS.map((hop, index) => (
        <div key={hop} className="flex items-center gap-1">
          <div
            className={cn(
              "border-2 border-border px-2 py-1 font-head text-[9px] uppercase tracking-wider transition-all",
              index <= activeHop
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted text-muted-foreground",
            )}
          >
            {hop}
          </div>
          {index < HOPS.length - 1 ? (
            <span className="text-muted-foreground" aria-hidden>
              →
            </span>
          ) : null}
        </div>
      ))}
    </div>
  );
}
