"use client";

import type { Editor } from "@tiptap/react";
import {
  Bold,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  ListTodo,
  Quote,
  Strikethrough,
  Underline as UnderlineIcon,
} from "lucide-react";
import { Button } from "@/components/retroui/Button";
import { cn } from "@/lib/utils";

type NoteToolbarProps = {
  editor: Editor | null;
  readOnly?: boolean;
};

function ToolbarButton({
  active,
  disabled,
  onClick,
  label,
  children,
}: {
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      variant={active ? "default" : "outline"}
      size="sm"
      className={cn("h-8 px-2", active && "shadow-sm")}
      disabled={disabled}
      onClick={onClick}
      aria-label={label}
      title={label}
    >
      {children}
    </Button>
  );
}

export function NoteToolbar({ editor, readOnly = false }: NoteToolbarProps) {
  if (!editor) return null;

  function setLink() {
    const previous = editor!.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link URL", previous ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor!.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor!.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }

  return (
    <div className="sticky top-0 z-10 flex flex-wrap items-center gap-1 border-b-2 border-border bg-background/95 px-2 py-2 backdrop-blur-sm">
      <ToolbarButton
        label="Heading 1"
        active={editor.isActive("heading", { level: 1 })}
        disabled={readOnly}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
      >
        <Heading1 className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Heading 2"
        active={editor.isActive("heading", { level: 2 })}
        disabled={readOnly}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <Heading2 className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Heading 3"
        active={editor.isActive("heading", { level: 3 })}
        disabled={readOnly}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        <Heading3 className="size-4" />
      </ToolbarButton>

      <span className="mx-1 h-6 w-px bg-border" aria-hidden />

      <ToolbarButton
        label="Bold"
        active={editor.isActive("bold")}
        disabled={readOnly}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Italic"
        active={editor.isActive("italic")}
        disabled={readOnly}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Underline"
        active={editor.isActive("underline")}
        disabled={readOnly}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <UnderlineIcon className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Strikethrough"
        active={editor.isActive("strike")}
        disabled={readOnly}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        <Strikethrough className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Code"
        active={editor.isActive("code")}
        disabled={readOnly}
        onClick={() => editor.chain().focus().toggleCode().run()}
      >
        <Code className="size-4" />
      </ToolbarButton>

      <span className="mx-1 h-6 w-px bg-border" aria-hidden />

      <ToolbarButton
        label="Bullet list"
        active={editor.isActive("bulletList")}
        disabled={readOnly}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Numbered list"
        active={editor.isActive("orderedList")}
        disabled={readOnly}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Task list"
        active={editor.isActive("taskList")}
        disabled={readOnly}
        onClick={() => editor.chain().focus().toggleTaskList().run()}
      >
        <ListTodo className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Quote"
        active={editor.isActive("blockquote")}
        disabled={readOnly}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        <Quote className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Link"
        active={editor.isActive("link")}
        disabled={readOnly}
        onClick={setLink}
      >
        <LinkIcon className="size-4" />
      </ToolbarButton>
    </div>
  );
}
