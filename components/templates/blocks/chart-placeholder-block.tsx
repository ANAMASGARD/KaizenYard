import type { ChartSection } from "@/lib/templates/types";
import { BarChart3, LineChart, PieChart } from "lucide-react";
import { BlockShell } from "@/components/templates/blocks/block-shell";
import { cn } from "@/lib/utils";

const CHART_ICONS = {
  bar: BarChart3,
  line: LineChart,
  donut: PieChart,
} as const;

export function ChartPlaceholderBlock({ section }: { section: ChartSection }) {
  const Icon = CHART_ICONS[section.chartType];

  return (
    <BlockShell title={section.title}>
      <div className="flex min-h-40 flex-col items-center justify-center gap-3 rounded border-2 border-dashed border-border bg-muted/30 p-6">
        <Icon className="size-10 text-muted-foreground" />
        <p className="font-head text-xs uppercase tracking-[0.2em] text-muted-foreground">
          {section.chartType} chart placeholder
        </p>
        <div className="flex h-16 w-full max-w-md items-end justify-center gap-2">
          {[40, 65, 50, 80, 55].map((height, index) => (
            <div
              key={index}
              className={cn("w-6 rounded-t bg-[var(--app-accent,#F97316)]/70")}
              style={{ height: `${height}%` }}
            />
          ))}
        </div>
      </div>
    </BlockShell>
  );
}
