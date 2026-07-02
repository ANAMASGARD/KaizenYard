import type { Editor, Range } from "@tiptap/core";

export type SlashCommandItem = {
  title: string;
  description: string;
  command: (props: { editor: Editor; range: Range }) => void;
};
