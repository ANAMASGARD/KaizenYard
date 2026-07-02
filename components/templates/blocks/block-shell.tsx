import type { ReactNode } from "react";
import { Card } from "@/components/retroui/Card";
import { cn } from "@/lib/utils";

export function BlockShell({
  title,
  children,
  className,
}: {
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card
      className={cn(
        "block w-full border-2 border-border bg-background p-4 shadow-md",
        className,
      )}
    >
      {title ? (
        <h3 className="mb-3 font-head text-sm font-bold uppercase tracking-[0.18em] text-muted-foreground">
          {title}
        </h3>
      ) : null}
      {children}
    </Card>
  );
}
