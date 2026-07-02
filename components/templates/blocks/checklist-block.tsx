import type { ChecklistItem, ChecklistSection } from "@/lib/templates/types";
import { BlockShell } from "@/components/templates/blocks/block-shell";
import { Checkbox } from "@/components/retroui/Checkbox";

export function ChecklistBlock({
  section,
  runtime,
  onRuntimeChange,
}: {
  section: ChecklistSection;
  runtime: { items?: ChecklistItem[] };
  onRuntimeChange: (runtime: { items: ChecklistItem[] }) => void;
}) {
  const items = runtime.items ?? section.items;

  const toggleItem = (itemId: string, checked: boolean) => {
    onRuntimeChange({
      items: items.map((item) =>
        item.id === itemId ? { ...item, checked } : item,
      ),
    });
  };

  return (
    <BlockShell title={section.title}>
      <ul className="space-y-2">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex items-center gap-2.5 rounded border-2 border-border bg-background px-3 py-2 shadow-sm"
          >
            <Checkbox
              checked={item.checked ?? false}
              onCheckedChange={(checked) => toggleItem(item.id, checked === true)}
              aria-label={item.label}
            />
            <span
              className={
                item.checked ? "text-muted-foreground line-through" : undefined
              }
            >
              {item.label}
            </span>
          </li>
        ))}
      </ul>
    </BlockShell>
  );
}
