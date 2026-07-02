export const SIDEBAR_PIN_LIMIT = 3 as const;

export const PROMPT_MAX_LENGTH = 500 as const;

export const RUNTIME_AUTOSAVE_DEBOUNCE_MS = 800 as const;

export type AppLayout = "single-page";
export type SectionLayout = "full" | "half" | "third";

export type SectionType =
  | "stats"
  | "list"
  | "table"
  | "form"
  | "progress"
  | "checklist"
  | "tags"
  | "chart"
  | "text";

export type AppActionVariant = "default" | "outline" | "secondary";

export type AppAction = {
  id: string;
  label: string;
  variant?: AppActionVariant;
};

export type StatsItem = {
  label: string;
  value: string;
  hint?: string;
};

export type ListItem = {
  title: string;
  subtitle?: string;
  tag?: string;
};

export type FormFieldType =
  | "text"
  | "number"
  | "email"
  | "textarea"
  | "select";

export type FormField = {
  id: string;
  label: string;
  type: FormFieldType;
  placeholder?: string;
  options?: string[];
};

export type ChecklistItem = {
  id: string;
  label: string;
  checked?: boolean;
};

export type ChartType = "bar" | "line" | "donut";

export type AppSectionBase = {
  id: string;
  title?: string;
  layout?: SectionLayout;
};

export type StatsSection = AppSectionBase & {
  type: "stats";
  items: StatsItem[];
  columns?: 2 | 3 | 4;
};

export type ListSection = AppSectionBase & {
  type: "list";
  items: ListItem[];
};

export type TableSection = AppSectionBase & {
  type: "table";
  columns: string[];
  rows: string[][];
};

export type FormSection = AppSectionBase & {
  type: "form";
  fields: FormField[];
};

export type ProgressSection = AppSectionBase & {
  type: "progress";
  label: string;
  value: number;
  max: number;
};

export type ChecklistSection = AppSectionBase & {
  type: "checklist";
  items: ChecklistItem[];
};

export type TagsSection = AppSectionBase & {
  type: "tags";
  items: string[];
};

export type ChartSection = AppSectionBase & {
  type: "chart";
  chartType: ChartType;
};

export type TextSection = AppSectionBase & {
  type: "text";
  content: string;
  heading?: boolean;
};

export type AppSection =
  | StatsSection
  | ListSection
  | TableSection
  | FormSection
  | ProgressSection
  | ChecklistSection
  | TagsSection
  | ChartSection
  | TextSection;

export type GeneratedAppDefinition = {
  appName: string;
  description: string;
  icon: string;
  color: string;
  layout: AppLayout;
  sections: AppSection[];
  actions: AppAction[];
  sampleData: Record<string, unknown>;
};

export type GeneratedAppRecord = {
  id: number;
  clerkId: string;
  appName: string;
  description: string;
  icon: string;
  color: string;
  layout: AppLayout;
  definition: GeneratedAppDefinition;
  runtimeState: Record<string, unknown>;
  sidebarPinned: boolean;
  sidebarOrder: number | null;
  shareToken: string | null;
  shareEnabled: boolean;
  shareMode: "private" | "link" | "collaborators";
  isZkShare: boolean;
  shareCommitment: string | null;
  shareSalt: string | null;
  shareNullifierRoot: string | null;
  createdAt: string;
  updatedAt: string;
};

export type GeneratedAppListItem = {
  id: number;
  appName: string;
  description: string;
  icon: string;
  color: string;
  sidebarPinned: boolean;
  sidebarOrder: number | null;
  shareToken: string | null;
  shareEnabled: boolean;
  shareMode: "private" | "link" | "collaborators";
  isZkShare: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PinnedSidebarApp = {
  id: number;
  appName: string;
  icon: string;
  color: string;
  sidebarOrder: number | null;
};

export const SUGGESTION_PROMPTS = [
  {
    label: "Habit Tracker",
    prompt:
      "Build a Habit Tracker to track daily habits, streaks, and weekly progress.",
  },
  {
    label: "Budget Tracker",
    prompt:
      "Build a Budget Tracker with income, expenses, categories, and monthly savings progress.",
  },
  {
    label: "Meal Planner",
    prompt:
      "Build a Meal Planner with weekly meals, grocery list, and nutrition tags.",
  },
  {
    label: "Study Planner",
    prompt:
      "Build a Study Planner with subjects, tasks, deadlines, and weekly progress.",
  },
] as const;
