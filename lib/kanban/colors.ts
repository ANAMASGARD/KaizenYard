export const KANBAN_COLORS = [
  "blue",
  "yellow",
  "green",
  "purple",
  "pink",
  "orange",
  "cyan",
  "emerald",
] as const;

export type KanbanColor = (typeof KANBAN_COLORS)[number];

export type ColorMeta = {
  id: KanbanColor;
  label: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
  dotClass: string;
};

export const COLOR_META: Record<KanbanColor, ColorMeta> = {
  blue: {
    id: "blue",
    label: "Blue",
    bgClass: "bg-blue-100 dark:bg-blue-950",
    borderClass: "border-blue-600 dark:border-blue-400",
    textClass: "text-blue-900 dark:text-blue-100",
    dotClass: "bg-blue-600 dark:bg-blue-400",
  },
  yellow: {
    id: "yellow",
    label: "Yellow",
    bgClass: "bg-amber-100 dark:bg-amber-950",
    borderClass: "border-amber-500 dark:border-amber-400",
    textClass: "text-amber-900 dark:text-amber-100",
    dotClass: "bg-amber-500 dark:bg-amber-400",
  },
  green: {
    id: "green",
    label: "Green",
    bgClass: "bg-emerald-100 dark:bg-emerald-950",
    borderClass: "border-emerald-600 dark:border-emerald-400",
    textClass: "text-emerald-900 dark:text-emerald-100",
    dotClass: "bg-emerald-600 dark:bg-emerald-400",
  },
  purple: {
    id: "purple",
    label: "Purple",
    bgClass: "bg-violet-100 dark:bg-violet-950",
    borderClass: "border-violet-600 dark:border-violet-400",
    textClass: "text-violet-900 dark:text-violet-100",
    dotClass: "bg-violet-600 dark:bg-violet-400",
  },
  pink: {
    id: "pink",
    label: "Pink",
    bgClass: "bg-pink-100 dark:bg-pink-950",
    borderClass: "border-pink-600 dark:border-pink-400",
    textClass: "text-pink-900 dark:text-pink-100",
    dotClass: "bg-pink-600 dark:bg-pink-400",
  },
  orange: {
    id: "orange",
    label: "Orange",
    bgClass: "bg-orange-100 dark:bg-orange-950",
    borderClass: "border-orange-600 dark:border-orange-400",
    textClass: "text-orange-900 dark:text-orange-100",
    dotClass: "bg-orange-600 dark:bg-orange-400",
  },
  cyan: {
    id: "cyan",
    label: "Cyan",
    bgClass: "bg-cyan-100 dark:bg-cyan-950",
    borderClass: "border-cyan-600 dark:border-cyan-400",
    textClass: "text-cyan-900 dark:text-cyan-100",
    dotClass: "bg-cyan-600 dark:bg-cyan-400",
  },
  emerald: {
    id: "emerald",
    label: "Emerald",
    bgClass: "bg-teal-100 dark:bg-teal-950",
    borderClass: "border-teal-600 dark:border-teal-400",
    textClass: "text-teal-900 dark:text-teal-100",
    dotClass: "bg-teal-600 dark:bg-teal-400",
  },
};

export function isKanbanColor(value: string): value is KanbanColor {
  return KANBAN_COLORS.includes(value as KanbanColor);
}

export const DEFAULT_BOARD_COLUMNS = [
  { name: "Todo", color: "blue" as KanbanColor, sortOrder: 0 },
  { name: "In Progress", color: "yellow" as KanbanColor, sortOrder: 1 },
  { name: "Done", color: "green" as KanbanColor, sortOrder: 2 },
] as const;
