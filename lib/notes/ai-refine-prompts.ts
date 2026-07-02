export type AiRefineAction =
  | "improve_grammar"
  | "rephrase"
  | "make_shorter"
  | "make_longer"
  | "simplify"
  | "change_tone";

export const AI_REFINE_ACTIONS: {
  id: AiRefineAction;
  label: string;
}[] = [
  { id: "improve_grammar", label: "Improve grammar" },
  { id: "rephrase", label: "Rephrase" },
  { id: "make_shorter", label: "Make shorter" },
  { id: "make_longer", label: "Make longer" },
  { id: "simplify", label: "Simplify language" },
  { id: "change_tone", label: "Change tone" },
];

export function buildRefinePrompt(action: AiRefineAction, text: string): string {
  const base = `Return only the rewritten text with no quotes or explanation.\n\nText:\n${text}`;

  switch (action) {
    case "improve_grammar":
      return `Fix grammar, spelling, and punctuation while preserving meaning.\n${base}`;
    case "rephrase":
      return `Rephrase the text in a fresh way while keeping the same meaning.\n${base}`;
    case "make_shorter":
      return `Make the text more concise without losing key information.\n${base}`;
    case "make_longer":
      return `Expand the text with helpful detail while staying on topic.\n${base}`;
    case "simplify":
      return `Simplify the language so it is easy to understand.\n${base}`;
    case "change_tone":
      return `Rewrite with a warmer, more professional tone.\n${base}`;
    default: {
      const _exhaustive: never = action;
      return _exhaustive;
    }
  }
}
