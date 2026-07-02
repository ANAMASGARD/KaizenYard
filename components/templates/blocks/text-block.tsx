import type { TextSection } from "@/lib/templates/types";
import { BlockShell } from "@/components/templates/blocks/block-shell";

export function TextBlock({ section }: { section: TextSection }) {
  return (
    <BlockShell title={section.title}>
      {section.heading ? (
        <h2 className="font-head text-xl">{section.content}</h2>
      ) : (
        <p className="font-sans text-muted-foreground">{section.content}</p>
      )}
    </BlockShell>
  );
}
