import type { CommentBody } from "@liveblocks/client";

export function textToCommentBody(text: string): CommentBody {
  return {
    version: 1,
    content: [
      {
        type: "paragraph",
        children: [{ text: text.trim() }],
      },
    ],
  };
}

export function commentBodyToPlainText(body: CommentBody | undefined): string {
  if (!body?.content) return "";

  return body.content
    .map((block) => {
      if (block.type !== "paragraph" || !("children" in block)) {
        return "";
      }
      return block.children
        .map((child) => ("text" in child ? child.text : ""))
        .join("");
    })
    .filter(Boolean)
    .join("\n");
}

export function formatCommentTime(iso: string | Date): string {
  const date = typeof iso === "string" ? new Date(iso) : iso;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;

  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}
