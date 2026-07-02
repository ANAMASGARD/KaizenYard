import { Extension } from "@tiptap/core";
import Suggestion, { type SuggestionOptions } from "@tiptap/suggestion";
import { ReactRenderer } from "@tiptap/react";
import type { Editor, Range } from "@tiptap/core";
import type { SlashCommandItem } from "@/lib/notes/slash-command-types";

export const SLASH_COMMANDS: SlashCommandItem[] = [
  {
    title: "Text",
    description: "Plain paragraph",
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setParagraph().run();
    },
  },
  {
    title: "Heading 1",
    description: "Large section heading",
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHeading({ level: 1 }).run();
    },
  },
  {
    title: "Heading 2",
    description: "Medium section heading",
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHeading({ level: 2 }).run();
    },
  },
  {
    title: "Heading 3",
    description: "Small section heading",
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHeading({ level: 3 }).run();
    },
  },
  {
    title: "Bullet list",
    description: "Unordered list",
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBulletList().run();
    },
  },
  {
    title: "Numbered list",
    description: "Ordered list",
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleOrderedList().run();
    },
  },
  {
    title: "Task list",
    description: "Checklist with boxes",
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleTaskList().run();
    },
  },
  {
    title: "Quote",
    description: "Blockquote",
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBlockquote().run();
    },
  },
  {
    title: "Code",
    description: "Code block",
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleCodeBlock().run();
    },
  },
  {
    title: "Divider",
    description: "Horizontal rule",
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHorizontalRule().run();
    },
  },
];

type SlashCommandListComponent = React.ComponentType<{
  items: SlashCommandItem[];
  command: (item: SlashCommandItem) => void;
}>;

export function createSlashCommandExtension(
  SlashCommandList: SlashCommandListComponent,
): Extension {
  return Extension.create({
    name: "slashCommand",

    addOptions() {
      return {
        suggestion: {
          char: "/",
          command: ({
            editor,
            range,
            props,
          }: {
            editor: Editor;
            range: Range;
            props: SlashCommandItem;
          }) => {
            props.command({ editor, range });
          },
        } as Partial<SuggestionOptions<SlashCommandItem>>,
      };
    },

    addProseMirrorPlugins() {
      return [
        Suggestion({
          editor: this.editor,
          ...this.options.suggestion,
          items: ({ query }) =>
            SLASH_COMMANDS.filter((item) =>
              item.title.toLowerCase().includes(query.toLowerCase()),
            ),
          render: () => {
            let component: ReactRenderer | null = null;

            return {
              onStart: (props) => {
                component = new ReactRenderer(SlashCommandList, {
                  props,
                  editor: props.editor,
                });
              },
              onUpdate: (props) => {
                component?.updateProps(props);
              },
              onKeyDown: (props) => {
                if (props.event.key === "Escape") {
                  component?.destroy();
                  return true;
                }
                return (
                  component?.ref as { onKeyDown?: (props: unknown) => boolean }
                )?.onKeyDown?.(props) ?? false;
              },
              onExit: () => {
                component?.destroy();
              },
            };
          },
        }),
      ];
    },
  });
}
