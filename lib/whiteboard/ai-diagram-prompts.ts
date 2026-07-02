export type AiDiagramType =
  | "flowchart"
  | "mind_map"
  | "system_architecture"
  | "user_journey"
  | "process";

const DIAGRAM_TYPES: AiDiagramType[] = [
  "flowchart",
  "mind_map",
  "system_architecture",
  "user_journey",
  "process",
];

export function isAiDiagramType(value: string): value is AiDiagramType {
  return DIAGRAM_TYPES.includes(value as AiDiagramType);
}

const DIAGRAM_LABELS: Record<AiDiagramType, string> = {
  flowchart: "Flowchart",
  mind_map: "Mind map",
  system_architecture: "System architecture",
  user_journey: "User journey",
  process: "Process diagram",
};

export function getDiagramTypeLabel(type: AiDiagramType): string {
  return DIAGRAM_LABELS[type];
}

export const AI_DIAGRAM_TYPES = DIAGRAM_TYPES;

export function buildAiDiagramPrompt(
  diagramType: AiDiagramType,
  userPrompt: string,
): string {
  const typeLabel = DIAGRAM_LABELS[diagramType];

  return `You are a diagram generator for Excalidraw whiteboards.

Create a ${typeLabel} based on this request:
${userPrompt}

Return ONLY valid JSON with this exact shape (no markdown, no explanation):
{
  "elements": [
    /* Excalidraw element objects */
  ]
}

Rules:
- Use only these element types: rectangle, ellipse, diamond, arrow, line, text
- Each element must include required Excalidraw fields: type, id, x, y, width, height, angle, strokeColor, backgroundColor, fillStyle, strokeWidth, strokeStyle, roughness, opacity, groupIds, frameId, roundness, seed, version, versionNonce, isDeleted, boundElements, updated, link, locked
- For text elements also include: text, fontSize (20), fontFamily (1), textAlign, verticalAlign, containerId (or null), originalText, autoResize, lineHeight
- Use unique string ids for every element
- Position elements in a readable layout starting near x=100, y=100 with ~40px spacing
- Use pastel backgroundColor for shapes (#fef08a yellow, #bbf7d0 green, #bfdbfe blue, #e9d5ff purple)
- strokeColor should be #1e1e1e
- Connect flowchart/architecture nodes with arrow elements (include startArrowhead/endArrowhead as null or "arrow")
- Keep diagrams concise: 3-12 elements for simple prompts, up to 20 for complex ones`;
}
