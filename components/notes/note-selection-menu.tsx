"use client";

import type { Editor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import { ReadAloud } from "@/components/notes/read-aloud";

type NoteSelectionMenuProps = {
  editor: Editor | null;
  speak: (text: string) => void;
  stop: () => void;
  isSpeaking: boolean;
  supported: boolean;
  error?: string | null;
};

export function NoteSelectionMenu({
  editor,
  speak,
  stop,
  isSpeaking,
  supported,
  error,
}: NoteSelectionMenuProps) {
  if (!editor || !supported) return null;

  return (
    <BubbleMenu
      editor={editor}
      className="flex items-center gap-1 rounded border-2 border-border bg-background p-1 shadow-md"
    >
      <ReadAloud
        getText={() => {
          const { from, to } = editor.state.selection;
          return editor.state.doc.textBetween(from, to, " ");
        }}
        label="Read aloud"
        speak={speak}
        stop={stop}
        isSpeaking={isSpeaking}
        supported={supported}
        error={error}
        compact
      />
    </BubbleMenu>
  );
}
