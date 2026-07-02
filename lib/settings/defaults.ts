import { CALENDAR_CATEGORIES, CATEGORY_META } from "@/lib/calendar/categories";
import { KANBAN_LABELS, LABEL_META } from "@/lib/kanban/labels";
import type { AiFeatures, CategoryModule, NotificationSettings, UserSettingsRecord } from "@/lib/settings/types";

export const DEFAULT_AI_FEATURES: AiFeatures = {
  refine: true,
  assistant: true,
  templates: true,
  autoSuggestions: true,
  summarization: true,
  notesAi: true,
  tasksAi: true,
};

export const DEFAULT_NOTIFICATIONS: NotificationSettings = {
  email: true,
  taskReminders: true,
  comments: true,
  marketing: false,
  systemUpdates: true,
  push: false,
  dueDateAlertOffset: "1d",
};

export const DEFAULT_USER_SETTINGS: UserSettingsRecord = {
  defaultCalendarView: "week",
  defaultTaskPriority: "medium",
  dateFormat: "MMM d, yyyy",
  timeFormat: "12h",
  weekStartsOn: 0,
  autoSave: true,
  compactMode: false,
  showCompletedTasks: true,
  timezone: "UTC",
  locale: "en",
  accentColor: "yellow",
  aiModel: "qwen/qwen3.5-flash-02-23",
  aiBehavior: "balanced",
  aiTone: "friendly",
  aiOutputLanguage: "en",
  aiFeatures: DEFAULT_AI_FEATURES,
  allowAiDataUsage: true,
  notifications: DEFAULT_NOTIFICATIONS,
};

export const AI_MODEL_OPTIONS = [
  {
    id: "qwen/qwen3.5-flash-02-23",
    label: "Smart Model",
    description: "Balanced quality and speed (default)",
  },
  {
    id: "google/gemini-2.5-flash",
    label: "Fast Model",
    description: "Lower latency for quick drafts",
  },
  {
    id: "anthropic/claude-sonnet-4",
    label: "Advanced Model",
    description: "Higher quality for complex tasks",
  },
] as const;

export const ACCENT_COLORS = [
  "yellow",
  "blue",
  "emerald",
  "violet",
  "pink",
  "orange",
  "cyan",
  "red",
] as const;

export type CategorySeed = {
  key: string;
  name: string;
  color: string;
  icon: string;
};

const CALENDAR_ICON_MAP: Record<string, string> = {
  meetings: "users",
  design: "palette",
  client: "briefcase",
  planning: "calendar",
  content: "megaphone",
  personal: "user",
  tasks: "kanban",
};

const KANBAN_ICON_MAP: Record<string, string> = {
  frontend: "monitor",
  backend: "server",
  design: "palette",
  bug: "bug",
  docs: "file-text",
  marketing: "megaphone",
};

const NOTES_SEEDS: CategorySeed[] = [
  { key: "work", name: "Work", color: "blue", icon: "briefcase" },
  { key: "personal", name: "Personal", color: "emerald", icon: "user" },
  { key: "ideas", name: "Ideas", color: "violet", icon: "lightbulb" },
  { key: "reference", name: "Reference", color: "orange", icon: "book-open" },
];

const REMINDER_SEEDS: CategorySeed[] = [
  { key: "personal", name: "Personal", color: "emerald", icon: "user" },
  { key: "work", name: "Work", color: "blue", icon: "briefcase" },
  { key: "health", name: "Health", color: "pink", icon: "heart" },
];

export function getCategorySeeds(module: CategoryModule): CategorySeed[] {
  switch (module) {
    case "calendar":
      return CALENDAR_CATEGORIES.map((key) => ({
        key,
        name: CATEGORY_META[key].label,
        color: mapCalendarColor(key),
        icon: CALENDAR_ICON_MAP[key] ?? "tag",
      }));
    case "kanban":
      return KANBAN_LABELS.map((key) => ({
        key,
        name: LABEL_META[key].label,
        color: mapKanbanLabelColor(key),
        icon: KANBAN_ICON_MAP[key] ?? "tag",
      }));
    case "notes":
      return NOTES_SEEDS;
    case "reminder":
      return REMINDER_SEEDS;
    default: {
      const _exhaustive: never = module;
      return _exhaustive;
    }
  }
}

function mapCalendarColor(key: string): string {
  const map: Record<string, string> = {
    meetings: "blue",
    design: "emerald",
    client: "orange",
    planning: "pink",
    content: "purple",
    personal: "orange",
    tasks: "emerald",
  };
  return map[key] ?? "blue";
}

function mapKanbanLabelColor(key: string): string {
  const map: Record<string, string> = {
    frontend: "blue",
    backend: "purple",
    design: "pink",
    bug: "orange",
    docs: "emerald",
    marketing: "orange",
  };
  return map[key] ?? "blue";
}
