import type { StatsSection } from "@/lib/templates/types";
import { BlockShell } from "@/components/templates/blocks/block-shell";

export function StatsBlock({ section }: { section: StatsSection }) {
  const columnsClass =
    section.columns === 2
      ? "sm:grid-cols-2"
      : section.columns === 3
        ? "sm:grid-cols-2 lg:grid-cols-3"
        : "sm:grid-cols-2 xl:grid-cols-4";

  return (
    <BlockShell title={section.title}>
      <div className={`grid gap-3 ${columnsClass}`}>
        {section.items.map((item) => (
          <div
            key={item.label}
            className="flex min-h-24 flex-col justify-between rounded border-2 border-border bg-background p-3 shadow-sm"
          >
            <p className="font-head text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
              {item.label}
            </p>
            <p className="mt-1 font-head text-2xl">{item.value}</p>
            {item.hint ? (
              <p className="mt-1 text-xs text-muted-foreground">{item.hint}</p>
            ) : null}
          </div>
        ))}
      </div>
    </BlockShell>
  );
}
