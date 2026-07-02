import type { ProgressSection } from "@/lib/templates/types";
import { BlockShell } from "@/components/templates/blocks/block-shell";
import { Progress } from "@/components/retroui/Progress";

export function ProgressBlock({
  section,
  runtime,
  onRuntimeChange,
}: {
  section: ProgressSection;
  runtime: { value?: number; max?: number };
  onRuntimeChange: (runtime: { value: number; max: number }) => void;
}) {
  const value = runtime.value ?? section.value;
  const max = runtime.max ?? section.max;
  const percent = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;

  return (
    <BlockShell title={section.title}>
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">{section.label}</span>
          <span className="font-head text-sm">
            {value} / {max} ({percent}%)
          </span>
        </div>
        <Progress value={percent} />
        <input
          type="range"
          min={0}
          max={max}
          value={value}
          onChange={(event) =>
            onRuntimeChange({ value: Number(event.target.value), max })
          }
          className="w-full accent-[var(--app-accent,#F97316)]"
          aria-label={section.label}
        />
      </div>
    </BlockShell>
  );
}
