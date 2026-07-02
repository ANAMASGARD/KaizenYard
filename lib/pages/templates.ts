import type { TiptapJson } from "@/lib/pages/types";

export const EMPTY_TIPTAP_DOC: TiptapJson = { type: "doc", content: [] };

export const PAGE_TEMPLATE_CONTENT: Record<string, TiptapJson> = {
  blank: EMPTY_TIPTAP_DOC,
  project_plan: {
    type: "doc",
    content: [
      {
        type: "heading",
        attrs: { level: 1 },
        content: [{ type: "text", text: "Project Plan" }],
      },
      {
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text: "Goals" }],
      },
      { type: "paragraph" },
      {
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text: "Timeline" }],
      },
      { type: "paragraph" },
      {
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text: "Milestones" }],
      },
      { type: "taskList", content: [] },
    ],
  },
  meeting_notes: {
    type: "doc",
    content: [
      {
        type: "heading",
        attrs: { level: 1 },
        content: [{ type: "text", text: "Meeting Notes" }],
      },
      {
        type: "paragraph",
        content: [
          { type: "text", marks: [{ type: "bold" }], text: "Date: " },
          { type: "text", text: "" },
        ],
      },
      {
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text: "Attendees" }],
      },
      { type: "paragraph" },
      {
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text: "Action Items" }],
      },
      { type: "taskList", content: [] },
    ],
  },
  prd: {
    type: "doc",
    content: [
      {
        type: "heading",
        attrs: { level: 1 },
        content: [{ type: "text", text: "Product Requirements" }],
      },
      {
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text: "Problem" }],
      },
      { type: "paragraph" },
      {
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text: "Solution" }],
      },
      { type: "paragraph" },
      {
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text: "Success Metrics" }],
      },
      { type: "paragraph" },
    ],
  },
  research_notes: {
    type: "doc",
    content: [
      {
        type: "heading",
        attrs: { level: 1 },
        content: [{ type: "text", text: "Research Notes" }],
      },
      {
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text: "Sources" }],
      },
      { type: "paragraph" },
      {
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text: "Findings" }],
      },
      { type: "paragraph" },
    ],
  },
  task_plan: {
    type: "doc",
    content: [
      {
        type: "heading",
        attrs: { level: 1 },
        content: [{ type: "text", text: "Task Plan" }],
      },
      { type: "taskList", content: [] },
    ],
  },
};

export function templateContent(template: string): TiptapJson {
  return PAGE_TEMPLATE_CONTENT[template] ?? EMPTY_TIPTAP_DOC;
}
