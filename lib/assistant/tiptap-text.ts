type TiptapNode = {
  type?: string;
  text?: string;
  content?: TiptapNode[];
};

export function tiptapJsonToPlainText(content: unknown, maxLength = 8000): string {
  if (!content || typeof content !== "object") {
    return "";
  }

  const parts: string[] = [];

  function walk(node: TiptapNode) {
    if (node.text) {
      parts.push(node.text);
    }
    if (node.type === "hardBreak") {
      parts.push("\n");
    }
    if (Array.isArray(node.content)) {
      for (const child of node.content) {
        walk(child);
      }
      if (node.type === "paragraph" || node.type === "heading" || node.type === "listItem") {
        parts.push("\n");
      }
    }
  }

  walk(content as TiptapNode);
  const text = parts.join("").replace(/\n{3,}/g, "\n\n").trim();
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength)}…`;
}
