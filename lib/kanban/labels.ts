export const KANBAN_PRIORITIES = ["low", "medium", "high"] as const;
export type KanbanPriority = (typeof KANBAN_PRIORITIES)[number];

export const KANBAN_LABELS = [
  "frontend",
  "backend",
  "design",
  "bug",
  "docs",
  "marketing",
] as const;
export type KanbanLabel = (typeof KANBAN_LABELS)[number];

export type PriorityMeta = {
  id: KanbanPriority;
  label: string;
  dotClass: string;
  badgeClass: string;
};

export const PRIORITY_META: Record<KanbanPriority, PriorityMeta> = {
  low: {
    id: "low",
    label: "Low",
    dotClass: "bg-slate-500",
    badgeClass: "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200",
  },
  medium: {
    id: "medium",
    label: "Medium",
    dotClass: "bg-amber-500",
    badgeClass: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-100",
  },
  high: {
    id: "high",
    label: "High",
    dotClass: "bg-red-500",
    badgeClass: "bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-100",
  },
};

export type LabelMeta = {
  id: KanbanLabel;
  label: string;
  chipClass: string;
};

export const LABEL_META: Record<KanbanLabel, LabelMeta> = {
  frontend: {
    id: "frontend",
    label: "Frontend",
    chipClass: "bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-100",
  },
  backend: {
    id: "backend",
    label: "Backend",
    chipClass: "bg-violet-100 text-violet-900 dark:bg-violet-950 dark:text-violet-100",
  },
  design: {
    id: "design",
    label: "Design",
    chipClass: "bg-pink-100 text-pink-900 dark:bg-pink-950 dark:text-pink-100",
  },
  bug: {
    id: "bug",
    label: "Bug",
    chipClass: "bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-100",
  },
  docs: {
    id: "docs",
    label: "Docs",
    chipClass: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100",
  },
  marketing: {
    id: "marketing",
    label: "Marketing",
    chipClass: "bg-orange-100 text-orange-900 dark:bg-orange-950 dark:text-orange-100",
  },
};

export function isKanbanPriority(value: string): value is KanbanPriority {
  return KANBAN_PRIORITIES.includes(value as KanbanPriority);
}

export function isKanbanLabel(value: string): value is KanbanLabel {
  return KANBAN_LABELS.includes(value as KanbanLabel);
}

export function filterValidLabels(labels: string[]): KanbanLabel[] {
  return labels.filter(isKanbanLabel);
}
