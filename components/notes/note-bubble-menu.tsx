"use client";

import { useState } from "react";
import type { Editor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import { Sparkles } from "lucide-react";
import { AI_REFINE_ACTIONS, type AiRefineAction } from "@/lib/notes/ai-refine-prompts";
import { Button } from "@/components/retroui/Button";
import { Popover } from "@/components/retroui/Popover";
import { cn } from "@/lib/utils";

type NoteBubbleMenuProps = {
  editor: Editor | null;
  noteId: number;
  readOnly?: boolean;
};

export function NoteBubbleMenu({
  editor,
  noteId,
  readOnly = false,
}: NoteBubbleMenuProps) {
  const [refining, setRefining] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);

  if (!editor || readOnly) return null;

  async function handleRefine(action: AiRefineAction) {
    const { from, to } = editor!.state.selection;
    const text = editor!.state.doc.textBetween(from, to, " ");
    if (!text.trim()) return;

    setRefining(true);
    setAiOpen(false);

    try {
      const res = await fetch("/api/notes/ai-refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, action, noteId }),
      });

      if (!res.ok) {
        throw new Error("AI refine failed");
      }

      const { text: refined } = (await res.json()) as { text: string };
      editor!
        .chain()
        .focus()
        .deleteRange({ from, to })
        .insertContentAt(from, refined)
        .run();
    } catch (err) {
      alert(err instanceof Error ? err.message : "AI refine failed");
    } finally {
      setRefining(false);
    }
  }

  return (
    <BubbleMenu
      editor={editor}
      className="flex items-center gap-1 rounded border-2 border-border bg-background p-1 shadow-md"
    >
      <Button
        type="button"
        variant={editor.isActive("bold") ? "default" : "outline"}
        size="sm"
        className="h-7 px-2 text-xs"
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        B
      </Button>
      <Button
        type="button"
        variant={editor.isActive("italic") ? "default" : "outline"}
        size="sm"
        className="h-7 px-2 text-xs italic"
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        I
      </Button>
      <Button
        type="button"
        variant={editor.isActive("underline") ? "default" : "outline"}
        size="sm"
        className="h-7 px-2 text-xs underline"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        U
      </Button>

      <span className="mx-0.5 h-5 w-px bg-border" aria-hidden />

      <Popover open={aiOpen} onOpenChange={setAiOpen}>
        <Popover.Trigger
          render={
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 gap-1 px-2 text-xs"
              disabled={refining}
            >
              <Sparkles className="size-3.5 text-violet-600" />
              {refining ? "Refining…" : "AI Refine"}
            </Button>
          }
        />
        <Popover.Content className="w-48 p-1">
          {AI_REFINE_ACTIONS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={cn(
                "flex w-full rounded px-2 py-1.5 text-left font-sans text-sm hover:bg-muted/60",
              )}
              onClick={() => void handleRefine(item.id)}
            >
              {item.label}
            </button>
          ))}
        </Popover.Content>
      </Popover>
    </BubbleMenu>
  );
}
