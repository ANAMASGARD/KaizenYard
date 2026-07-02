export const CALENDAR_VIEWS = ["day", "week", "month"] as const;
export type CalendarView = (typeof CALENDAR_VIEWS)[number];

export const TIME_FORMATS = ["12h", "24h"] as const;
export type TimeFormat = (typeof TIME_FORMATS)[number];

export const AI_BEHAVIORS = ["helpful", "balanced", "creative"] as const;
export type AiBehavior = (typeof AI_BEHAVIORS)[number];

export const AI_TONES = ["friendly", "professional", "casual", "formal"] as const;
export type AiTone = (typeof AI_TONES)[number];

export const CATEGORY_MODULES = ["calendar", "kanban", "notes", "reminder"] as const;
export type CategoryModule = (typeof CATEGORY_MODULES)[number];

export type AiFeatures = {
  refine: boolean;
  assistant: boolean;
  templates: boolean;
  autoSuggestions: boolean;
  summarization: boolean;
  notesAi: boolean;
  tasksAi: boolean;
};

export type NotificationSettings = {
  email: boolean;
  taskReminders: boolean;
  comments: boolean;
  marketing: boolean;
  systemUpdates: boolean;
  push: boolean;
  dueDateAlertOffset: string;
};

export type UserSettingsRecord = {
  defaultCalendarView: CalendarView;
  defaultTaskPriority: string;
  dateFormat: string;
  timeFormat: TimeFormat;
  weekStartsOn: number;
  autoSave: boolean;
  compactMode: boolean;
  showCompletedTasks: boolean;
  timezone: string;
  locale: string;
  accentColor: string;
  aiModel: string;
  aiBehavior: AiBehavior;
  aiTone: AiTone;
  aiOutputLanguage: string;
  aiFeatures: AiFeatures;
  allowAiDataUsage: boolean;
  notifications: NotificationSettings;
};

export type UserCategoryRecord = {
  id: number;
  module: CategoryModule;
  key: string;
  name: string;
  color: string;
  icon: string;
  sortOrder: number;
  isSystem: boolean;
};

export type CategoryMeta = {
  key: string;
  label: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
  icon: string;
};

export type AiModelOption = {
  id: string;
  label: string;
  description: string;
};
