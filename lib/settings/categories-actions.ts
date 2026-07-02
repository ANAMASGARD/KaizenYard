"use server";

import { auth } from "@clerk/nextjs/server";
import { and, eq, sql } from "drizzle-orm";
import {
  calendarItems,
  db,
  kanbanTasks,
  notes,
  userCategories,
} from "@/db";
import { getCategorySeeds } from "@/lib/settings/defaults";
import { categoryToMeta } from "@/lib/settings/category-resolver";
import type { CategoryMeta, CategoryModule, UserCategoryRecord } from "@/lib/settings/types";

async function requireUserId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }
  return userId;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48) || "category";
}

function rowToRecord(row: typeof userCategories.$inferSelect): UserCategoryRecord {
  return {
    id: row.id,
    module: row.module as CategoryModule,
    key: row.key,
    name: row.name,
    color: row.color,
    icon: row.icon,
    sortOrder: row.sortOrder,
    isSystem: row.isSystem,
  };
}

async function seedCategoriesIfEmpty(
  userId: string,
  module: CategoryModule,
): Promise<UserCategoryRecord[]> {
  const existing = await db
    .select()
    .from(userCategories)
    .where(and(eq(userCategories.clerkId, userId), eq(userCategories.module, module)))
    .orderBy(userCategories.sortOrder);

  if (existing.length > 0) {
    return existing.map(rowToRecord);
  }

  const seeds = getCategorySeeds(module);
  const inserted = await db
    .insert(userCategories)
    .values(
      seeds.map((seed, index) => ({
        clerkId: userId,
        module,
        key: seed.key,
        name: seed.name,
        color: seed.color,
        icon: seed.icon,
        sortOrder: index,
        isSystem: true,
      })),
    )
    .returning();

  return inserted.map(rowToRecord);
}

export async function listUserCategories(
  module: CategoryModule,
): Promise<UserCategoryRecord[]> {
  const userId = await requireUserId();
  return seedCategoriesIfEmpty(userId, module);
}

export async function getCategoryMetaForUser(
  module: CategoryModule,
): Promise<CategoryMeta[]> {
  const categories = await listUserCategories(module);
  return categories.map(categoryToMeta);
}

export async function resolveCategoryMeta(
  module: CategoryModule,
  key: string,
): Promise<CategoryMeta> {
  const categories = await listUserCategories(module);
  const match = categories.find((c) => c.key === key);
  if (match) {
    return categoryToMeta(match);
  }
  return {
    key,
    label: key,
    bgClass: "bg-slate-100 dark:bg-slate-900",
    borderClass: "border-slate-600 dark:border-slate-400",
    textClass: "text-slate-900 dark:text-slate-100",
    icon: "tag",
  };
}

export async function createUserCategory(input: {
  module: CategoryModule;
  name: string;
  color: string;
  icon: string;
}): Promise<UserCategoryRecord> {
  const userId = await requireUserId();
  await seedCategoriesIfEmpty(userId, input.module);

  const existing = await listUserCategories(input.module);
  let key = slugify(input.name);
  let suffix = 1;
  while (existing.some((c) => c.key === key)) {
    key = `${slugify(input.name)}-${suffix}`;
    suffix += 1;
  }

  const [row] = await db
    .insert(userCategories)
    .values({
      clerkId: userId,
      module: input.module,
      key,
      name: input.name.trim(),
      color: input.color,
      icon: input.icon,
      sortOrder: existing.length,
      isSystem: false,
    })
    .returning();

  return rowToRecord(row);
}

export async function updateUserCategory(
  id: number,
  input: Partial<{ name: string; color: string; icon: string }>,
): Promise<UserCategoryRecord> {
  const userId = await requireUserId();

  const [row] = await db
    .update(userCategories)
    .set({
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.color !== undefined ? { color: input.color } : {}),
      ...(input.icon !== undefined ? { icon: input.icon } : {}),
      updatedAt: sql`now()`,
    })
    .where(and(eq(userCategories.id, id), eq(userCategories.clerkId, userId)))
    .returning();

  if (!row) {
    throw new Error("Category not found");
  }

  return rowToRecord(row);
}

export async function reorderUserCategories(
  module: CategoryModule,
  orderedIds: number[],
): Promise<UserCategoryRecord[]> {
  const userId = await requireUserId();
  const categories = await listUserCategories(module);
  const idSet = new Set(orderedIds);

  if (orderedIds.length !== categories.length || categories.some((c) => !idSet.has(c.id))) {
    throw new Error("Invalid category order");
  }

  await Promise.all(
    orderedIds.map((id, index) =>
      db
        .update(userCategories)
        .set({ sortOrder: index, updatedAt: sql`now()` })
        .where(
          and(
            eq(userCategories.id, id),
            eq(userCategories.clerkId, userId),
            eq(userCategories.module, module),
          ),
        ),
    ),
  );

  return listUserCategories(module);
}

async function countCategoryReferences(
  userId: string,
  module: CategoryModule,
  key: string,
): Promise<number> {
  switch (module) {
    case "calendar":
      return countCalendarReferences(userId, key, "task");
    case "reminder":
      return countCalendarReferences(userId, key, "reminder");
    case "kanban":
      return countKanbanReferences(userId, key);
    case "notes":
      return countNotesReferences(userId, key);
    default: {
      const _exhaustive: never = module;
      return _exhaustive;
    }
  }
}

async function countCalendarReferences(
  userId: string,
  key: string,
  itemType: string,
): Promise<number> {
  const rows = await db
    .select({ id: calendarItems.id })
    .from(calendarItems)
    .where(
      and(
        eq(calendarItems.clerkId, userId),
        eq(calendarItems.category, key),
        eq(calendarItems.itemType, itemType),
      ),
    );
  return rows.length;
}

async function countKanbanReferences(userId: string, key: string): Promise<number> {
  const rows = await db
    .select({ id: kanbanTasks.id, labels: kanbanTasks.labels })
    .from(kanbanTasks)
    .where(eq(kanbanTasks.clerkId, userId));
  return rows.filter((row) => row.labels.includes(key)).length;
}

async function countNotesReferences(userId: string, key: string): Promise<number> {
  const rows = await db
    .select({ id: notes.id })
    .from(notes)
    .where(and(eq(notes.clerkId, userId), eq(notes.categoryKey, key)));
  return rows.length;
}

export async function deleteUserCategory(id: number): Promise<void> {
  const userId = await requireUserId();

  const [existing] = await db
    .select()
    .from(userCategories)
    .where(and(eq(userCategories.id, id), eq(userCategories.clerkId, userId)));

  if (!existing) {
    throw new Error("Category not found");
  }

  const refCount = await countCategoryReferences(
    userId,
    existing.module as CategoryModule,
    existing.key,
  );

  if (refCount > 0) {
    throw new Error("Cannot delete a category that is in use");
  }

  await db
    .delete(userCategories)
    .where(and(eq(userCategories.id, id), eq(userCategories.clerkId, userId)));
}

export async function isValidCategoryKey(
  module: CategoryModule,
  key: string,
): Promise<boolean> {
  const categories = await listUserCategories(module);
  return categories.some((c) => c.key === key);
}

export async function filterValidCategoryKeys(
  module: CategoryModule,
  keys: string[],
): Promise<string[]> {
  const categories = await listUserCategories(module);
  const valid = new Set(categories.map((c) => c.key));
  return keys.filter((key) => valid.has(key));
}
