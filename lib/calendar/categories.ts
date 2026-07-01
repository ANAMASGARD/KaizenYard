export const CALENDAR_ITEM_TYPES = ["task", "reminder"] as const;
export type CalendarItemType = (typeof CALENDAR_ITEM_TYPES)[number];

export const CALENDAR_CATEGORIES = [
  "meetings",
  "design",
  "client",
  "planning",
  "content",
  "personal",
] as const;
export type CalendarCategory = (typeof CALENDAR_CATEGORIES)[number];

export type CategoryMeta = {
  id: CalendarCategory;
  label: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
};

export const CATEGORY_META: Record<CalendarCategory, CategoryMeta> = {
  meetings: {
    id: "meetings",
    label: "Meetings",
    bgClass: "bg-blue-100 dark:bg-blue-950",
    borderClass: "border-blue-600 dark:border-blue-400",
    textClass: "text-blue-900 dark:text-blue-100",
  },
  design: {
    id: "design",
    label: "Design / Product",
    bgClass: "bg-emerald-100 dark:bg-emerald-950",
    borderClass: "border-emerald-600 dark:border-emerald-400",
    textClass: "text-emerald-900 dark:text-emerald-100",
  },
  client: {
    id: "client",
    label: "Client / External",
    bgClass: "bg-amber-100 dark:bg-amber-950",
    borderClass: "border-amber-600 dark:border-amber-400",
    textClass: "text-amber-900 dark:text-amber-100",
  },
  planning: {
    id: "planning",
    label: "Planning / Sprint",
    bgClass: "bg-pink-100 dark:bg-pink-950",
    borderClass: "border-pink-600 dark:border-pink-400",
    textClass: "text-pink-900 dark:text-pink-100",
  },
  content: {
    id: "content",
    label: "Content / Marketing",
    bgClass: "bg-violet-100 dark:bg-violet-950",
    borderClass: "border-violet-600 dark:border-violet-400",
    textClass: "text-violet-900 dark:text-violet-100",
  },
  personal: {
    id: "personal",
    label: "Personal / Other",
    bgClass: "bg-orange-100 dark:bg-orange-950",
    borderClass: "border-orange-600 dark:border-orange-400",
    textClass: "text-orange-900 dark:text-orange-100",
  },
};

export function isCalendarCategory(value: string): value is CalendarCategory {
  return CALENDAR_CATEGORIES.includes(value as CalendarCategory);
}

export function isCalendarItemType(value: string): value is CalendarItemType {
  return CALENDAR_ITEM_TYPES.includes(value as CalendarItemType);
}
