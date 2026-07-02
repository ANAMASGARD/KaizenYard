import type { TagsSection } from "@/lib/templates/types";
import { Badge } from "@/components/retroui/Badge";
import { BlockShell } from "@/components/templates/blocks/block-shell";

export function TagsBlock({ section }: { section: TagsSection }) {
  return (
    <BlockShell title={section.title}>
      <div className="flex flex-wrap gap-2">
        {section.items.map((tag) => (
          <Badge key={tag} variant="default">
            {tag}
          </Badge>
        ))}
      </div>
    </BlockShell>
  );
}
