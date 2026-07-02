import { COLOR_META } from "@/lib/kanban/colors";
import type { CategoryMeta, UserCategoryRecord } from "@/lib/settings/types";

export function categoryToMeta(category: UserCategoryRecord): CategoryMeta {
  const colorMeta = COLOR_META[category.color as keyof typeof COLOR_META];
  if (colorMeta) {
    return {
      key: category.key,
      label: category.name,
      bgClass: colorMeta.bgClass,
      borderClass: colorMeta.borderClass,
      textClass: colorMeta.textClass,
      icon: category.icon,
    };
  }
  return {
    key: category.key,
    label: category.name,
    bgClass: "bg-slate-100 dark:bg-slate-900",
    borderClass: "border-slate-600 dark:border-slate-400",
    textClass: "text-slate-900 dark:text-slate-100",
    icon: category.icon,
  };
}

export function fallbackCategoryMeta(key: string): CategoryMeta {
  return {
    key,
    label: key,
    bgClass: "bg-slate-100 dark:bg-slate-900",
    borderClass: "border-slate-600 dark:border-slate-400",
    textClass: "text-slate-900 dark:text-slate-100",
    icon: "tag",
  };
}

export function metaRecordFromCategories(
  categories: UserCategoryRecord[],
): Record<string, CategoryMeta> {
  const record: Record<string, CategoryMeta> = {};
  for (const category of categories) {
    record[category.key] = categoryToMeta(category);
  }
  return record;
}
