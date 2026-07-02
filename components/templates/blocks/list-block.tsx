import type { ListSection } from "@/lib/templates/types";
import { Badge } from "@/components/retroui/Badge";
import { BlockShell } from "@/components/templates/blocks/block-shell";

export function ListBlock({ section }: { section: ListSection }) {
  return (
    <BlockShell title={section.title}>
      <ul className="divide-y-2 divide-border">
        {section.items.map((item, index) => (
          <li
            key={`${item.title}-${index}`}
            className="flex items-start justify-between gap-3 rounded py-2.5 first:pt-0 last:pb-0"
          >
            <div className="min-w-0">
              <p className="font-medium">{item.title}</p>
              {item.subtitle ? (
                <p className="text-sm text-muted-foreground">{item.subtitle}</p>
              ) : null}
            </div>
            {item.tag ? (
              <Badge variant="outline" className="shrink-0">
                {item.tag}
              </Badge>
            ) : null}
          </li>
        ))}
      </ul>
    </BlockShell>
  );
}
