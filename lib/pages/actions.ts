"use server";

import { auth } from "@clerk/nextjs/server";
import {
  and,
  desc,
  eq,
  ilike,
  isNotNull,
  isNull,
  or,
  sql,
} from "drizzle-orm";
import { db, pages, spaceCollaborators, spaces } from "@/db";
import { isKanbanColor } from "@/lib/kanban/colors";
import {
  getPageRole,
  getSpaceRole,
  requirePageAccess,
  requireSpaceAccess,
  requireSpaceOwnership,
} from "@/lib/pages/access";
import {
  isPageTemplate,
  pageRowToListItem,
  spaceRowToListItem,
} from "@/lib/pages/mappers";
import { countFilesForSpace } from "@/lib/pages/file-actions";
import { EMPTY_TIPTAP_DOC, templateContent } from "@/lib/pages/templates";
import { resolveInitialsForClerkIds } from "@/lib/pages/user-display";
import type { SpaceRole } from "@/lib/pages/room";
import type {
  CreatePageInput,
  CreateSpaceInput,
  PageListItem,
  PageRecord,
  SpaceFilter,
  SpaceListItem,
  SpaceRecord,
  SpaceSort,
  TiptapJson,
  UpdatePageInput,
  UpdateSpaceInput,
} from "@/lib/pages/types";

async function requireUserId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }
  return userId;
}

async function countPagesForSpace(spaceId: number): Promise<number> {
  const [result] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(pages)
    .where(and(eq(pages.spaceId, spaceId), isNull(pages.deletedAt)));
  return result?.count ?? 0;
}

async function getSpaceCounts(
  spaceId: number,
): Promise<{ pageCount: number; fileCount: number }> {
  const [pageCount, fileCount] = await Promise.all([
    countPagesForSpace(spaceId),
    countFilesForSpace(spaceId),
  ]);
  return { pageCount, fileCount };
}

function toSpaceRecord(
  row: typeof spaces.$inferSelect,
  role: SpaceRole,
  pageCount: number,
  fileCount: number,
): SpaceRecord {
  return {
    id: row.id,
    clerkId: row.clerkId,
    name: row.name,
    description: row.description,
    color: isKanbanColor(row.color) ? row.color : "yellow",
    isVault: row.isVault,
    vaultCommitment: row.vaultCommitment,
    vaultSalt: row.vaultSalt,
    pinned: row.pinned,
    isFavorite: row.isFavorite,
    archivedAt: row.archivedAt ? row.archivedAt.toISOString() : null,
    deletedAt: row.deletedAt ? row.deletedAt.toISOString() : null,
    sortOrder: row.sortOrder,
    role,
    pageCount,
    fileCount,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toPageRecord(
  row: typeof pages.$inferSelect,
  role: SpaceRole,
  redactContent = false,
): PageRecord {
  return {
    id: row.id,
    spaceId: row.spaceId,
    clerkId: row.clerkId,
    title: redactContent ? "••••••" : row.title,
    template: isPageTemplate(row.template) ? row.template : "blank",
    content: redactContent ? EMPTY_TIPTAP_DOC : (row.content as TiptapJson),
    isFavorite: row.isFavorite,
    archivedAt: row.archivedAt ? row.archivedAt.toISOString() : null,
    deletedAt: row.deletedAt ? row.deletedAt.toISOString() : null,
    sortOrder: row.sortOrder,
    lastEditedByClerkId: row.lastEditedByClerkId,
    role,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

async function resolveRoleForSpace(
  spaceId: number,
  clerkId: string,
  ownerClerkId: string,
): Promise<SpaceRole | null> {
  if (ownerClerkId === clerkId) return "owner";
  return getSpaceRole(spaceId, clerkId);
}

export async function listSpaces(options?: {
  filter?: SpaceFilter;
  query?: string;
  sort?: SpaceSort;
}): Promise<SpaceListItem[]> {
  const userId = await requireUserId();
  const filter = options?.filter ?? "all";
  const query = options?.query?.trim();
  const sort = options?.sort ?? "updated";

  const owned = await db
    .select()
    .from(spaces)
    .where(
      and(
        eq(spaces.clerkId, userId),
        isNull(spaces.deletedAt),
        filter === "archived"
          ? isNotNull(spaces.archivedAt)
          : isNull(spaces.archivedAt),
        filter === "favorites" ? eq(spaces.isFavorite, true) : undefined,
        query
          ? or(
              ilike(spaces.name, `%${query}%`),
              ilike(spaces.description, `%${query}%`),
            )
          : undefined,
      ),
    );

  const collabRows = await db
    .select({ space: spaces, role: spaceCollaborators.role })
    .from(spaceCollaborators)
    .innerJoin(spaces, eq(spaceCollaborators.spaceId, spaces.id))
    .where(
      and(
        eq(spaceCollaborators.clerkId, userId),
        isNotNull(spaceCollaborators.acceptedAt),
        isNull(spaces.deletedAt),
        filter === "archived"
          ? isNotNull(spaces.archivedAt)
          : isNull(spaces.archivedAt),
        filter === "favorites" ? eq(spaces.isFavorite, true) : undefined,
        query
          ? or(
              ilike(spaces.name, `%${query}%`),
              ilike(spaces.description, `%${query}%`),
            )
          : undefined,
      ),
    );

  const items: SpaceListItem[] = [];
  const seen = new Set<number>();
  const ownerClerkIds: string[] = [];

  for (const row of owned) {
    seen.add(row.id);
    ownerClerkIds.push(row.clerkId);
  }

  for (const { space } of collabRows) {
    if (seen.has(space.id)) continue;
    ownerClerkIds.push(space.clerkId);
  }

  const ownerInitialsMap = await resolveInitialsForClerkIds(ownerClerkIds);

  for (const row of owned) {
    const [pageCount, fileCount] = await Promise.all([
      countPagesForSpace(row.id),
      countFilesForSpace(row.id),
    ]);
    items.push(
      spaceRowToListItem(
        row,
        "owner",
        pageCount,
        fileCount,
        ownerInitialsMap.get(row.clerkId) ?? "??",
      ),
    );
  }

  for (const { space, role } of collabRows) {
    if (seen.has(space.id)) continue;
    seen.add(space.id);
    const spaceRole: SpaceRole =
      role === "viewer" ? "viewer" : role === "editor" ? "editor" : "editor";
    const [pageCount, fileCount] = await Promise.all([
      countPagesForSpace(space.id),
      countFilesForSpace(space.id),
    ]);
    items.push(
      spaceRowToListItem(
        space,
        spaceRole,
        pageCount,
        fileCount,
        ownerInitialsMap.get(space.clerkId) ?? "??",
      ),
    );
  }

  if (filter === "recent") {
    items.sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
    return items.slice(0, 12);
  }

  items.sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    if (sort === "name") return a.name.localeCompare(b.name);
    if (sort === "created") {
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    }
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  return items;
}

export async function getSpace(spaceId: number): Promise<SpaceRecord | null> {
  const userId = await requireUserId();

  const [row] = await db
    .select()
    .from(spaces)
    .where(eq(spaces.id, spaceId))
    .limit(1);

  if (!row) return null;

  const role = await resolveRoleForSpace(spaceId, userId, row.clerkId);
  if (!role) return null;

  const { pageCount, fileCount } = await getSpaceCounts(spaceId);
  return toSpaceRecord(row, role, pageCount, fileCount);
}

export async function createSpace(
  input?: CreateSpaceInput,
): Promise<SpaceRecord> {
  const userId = await requireUserId();

  const color =
    input?.color && isKanbanColor(input.color) ? input.color : "yellow";
  const isVault = input?.isVault ?? false;

  if (isVault && (!input?.vaultCommitment || !input?.vaultSalt)) {
    throw new Error("Vault commitment and salt are required for secure vaults");
  }

  const [maxOrder] = await db
    .select({ max: sql<number>`coalesce(max(${spaces.sortOrder}), -1)` })
    .from(spaces)
    .where(and(eq(spaces.clerkId, userId), isNull(spaces.deletedAt)));

  const [row] = await db
    .insert(spaces)
    .values({
      clerkId: userId,
      name: input?.name?.trim() || "Untitled Space",
      description: input?.description?.trim() || null,
      color,
      isVault,
      vaultCommitment: isVault ? input?.vaultCommitment : null,
      vaultSalt: isVault ? input?.vaultSalt : null,
      sortOrder: (maxOrder?.max ?? -1) + 1,
    })
    .returning();

  return toSpaceRecord(row, "owner", 0, 0);
}

export async function updateSpace(
  spaceId: number,
  input: UpdateSpaceInput,
): Promise<SpaceRecord> {
  const userId = await requireUserId();
  const role = await requireSpaceAccess(spaceId, userId, "editor");

  const [row] = await db
    .update(spaces)
    .set({
      ...(input.name !== undefined
        ? { name: input.name.trim() || "Untitled Space" }
        : {}),
      ...(input.description !== undefined
        ? { description: input.description?.trim() || null }
        : {}),
      ...(input.color !== undefined && isKanbanColor(input.color)
        ? { color: input.color }
        : {}),
      ...(input.pinned !== undefined ? { pinned: input.pinned } : {}),
      ...(input.isFavorite !== undefined ? { isFavorite: input.isFavorite } : {}),
      ...(input.archivedAt !== undefined
        ? {
            archivedAt: input.archivedAt ? new Date(input.archivedAt) : null,
          }
        : {}),
      updatedAt: sql`now()`,
    })
    .where(eq(spaces.id, spaceId))
    .returning();

  if (!row) {
    throw new Error("Space not found");
  }

  const { pageCount, fileCount } = await getSpaceCounts(spaceId);
  return toSpaceRecord(row, role, pageCount, fileCount);
}

export async function duplicateSpace(spaceId: number): Promise<SpaceRecord> {
  const userId = await requireUserId();
  await requireSpaceAccess(spaceId, userId, "viewer");

  const [source] = await db
    .select()
    .from(spaces)
    .where(eq(spaces.id, spaceId))
    .limit(1);

  if (!source) {
    throw new Error("Space not found");
  }

  if (source.isVault) {
    throw new Error("Secure vaults cannot be duplicated");
  }

  const created = await createSpace({
    name: `${source.name} (copy)`,
    description: source.description ?? undefined,
    color: isKanbanColor(source.color) ? source.color : "yellow",
  });

  const sourcePages = await db
    .select()
    .from(pages)
    .where(and(eq(pages.spaceId, spaceId), isNull(pages.deletedAt)));

  for (const page of sourcePages) {
    await createPage({
      spaceId: created.id,
      title: page.title,
      template: isPageTemplate(page.template) ? page.template : "blank",
      content: page.content as TiptapJson,
    });
  }

  const pageCount = await countPagesForSpace(created.id);
  return { ...created, pageCount, fileCount: 0 };
}

export async function softDeleteSpace(spaceId: number): Promise<void> {
  const userId = await requireUserId();
  await requireSpaceOwnership(spaceId, userId);

  await db
    .update(spaces)
    .set({ deletedAt: sql`now()`, updatedAt: sql`now()` })
    .where(eq(spaces.id, spaceId));
}

export async function listPagesInSpace(
  spaceId: number,
  options?: { query?: string; vaultLocked?: boolean },
): Promise<PageListItem[]> {
  const userId = await requireUserId();
  const role = await requireSpaceAccess(spaceId, userId, "viewer");
  const query = options?.query?.trim();
  const locked = options?.vaultLocked ?? false;

  const rows = await db
    .select()
    .from(pages)
    .where(
      and(
        eq(pages.spaceId, spaceId),
        isNull(pages.deletedAt),
        isNull(pages.archivedAt),
        query ? ilike(pages.title, `%${query}%`) : undefined,
      ),
    )
    .orderBy(desc(pages.isFavorite), desc(pages.updatedAt));

  const editorIds = rows.map(
    (row) => row.lastEditedByClerkId ?? row.clerkId,
  );
  const initialsMap = await resolveInitialsForClerkIds(editorIds);

  return rows.map((row) =>
    pageRowToListItem(
      row,
      role,
      initialsMap.get(row.lastEditedByClerkId ?? row.clerkId) ?? "??",
      locked,
    ),
  );
}

export async function getPage(
  pageId: number,
  options?: { vaultLocked?: boolean },
): Promise<PageRecord | null> {
  const userId = await requireUserId();

  const [row] = await db
    .select()
    .from(pages)
    .where(eq(pages.id, pageId))
    .limit(1);

  if (!row) return null;

  const role = await getPageRole(pageId, userId);
  if (!role) return null;

  const locked = options?.vaultLocked ?? false;
  return toPageRecord(row, role, locked);
}

export async function createPage(input: CreatePageInput): Promise<PageRecord> {
  const userId = await requireUserId();
  const role = await requireSpaceAccess(input.spaceId, userId, "editor");

  const template = input.template && isPageTemplate(input.template)
    ? input.template
    : "blank";

  const [maxOrder] = await db
    .select({ max: sql<number>`coalesce(max(${pages.sortOrder}), -1)` })
    .from(pages)
    .where(
      and(eq(pages.spaceId, input.spaceId), isNull(pages.deletedAt)),
    );

  const [row] = await db
    .insert(pages)
    .values({
      spaceId: input.spaceId,
      clerkId: userId,
      title: input.title?.trim() || "Untitled",
      template,
      content: input.content ?? templateContent(template),
      sortOrder: (maxOrder?.max ?? -1) + 1,
      lastEditedByClerkId: userId,
    })
    .returning();

  await db
    .update(spaces)
    .set({ updatedAt: sql`now()` })
    .where(eq(spaces.id, input.spaceId));

  return toPageRecord(row, role);
}

export async function updatePage(
  pageId: number,
  input: UpdatePageInput,
): Promise<PageRecord> {
  const userId = await requireUserId();
  const role = await requirePageAccess(pageId, userId, "editor");

  const [row] = await db
    .update(pages)
    .set({
      ...(input.title !== undefined
        ? { title: input.title.trim() || "Untitled" }
        : {}),
      ...(input.template !== undefined && isPageTemplate(input.template)
        ? { template: input.template }
        : {}),
      ...(input.content !== undefined ? { content: input.content } : {}),
      ...(input.isFavorite !== undefined ? { isFavorite: input.isFavorite } : {}),
      ...(input.archivedAt !== undefined
        ? {
            archivedAt: input.archivedAt ? new Date(input.archivedAt) : null,
          }
        : {}),
      lastEditedByClerkId: userId,
      updatedAt: sql`now()`,
    })
    .where(eq(pages.id, pageId))
    .returning();

  if (!row) {
    throw new Error("Page not found");
  }

  await db
    .update(spaces)
    .set({ updatedAt: sql`now()` })
    .where(eq(spaces.id, row.spaceId));

  return toPageRecord(row, role);
}

export async function duplicatePage(pageId: number): Promise<PageRecord> {
  const userId = await requireUserId();
  await requirePageAccess(pageId, userId, "viewer");

  const [source] = await db
    .select()
    .from(pages)
    .where(eq(pages.id, pageId))
    .limit(1);

  if (!source) {
    throw new Error("Page not found");
  }

  return createPage({
    spaceId: source.spaceId,
    title: `${source.title} (copy)`,
    template: isPageTemplate(source.template) ? source.template : "blank",
    content: source.content as TiptapJson,
  });
}

export async function togglePageFavorite(pageId: number): Promise<PageRecord> {
  const userId = await requireUserId();
  const role = await requirePageAccess(pageId, userId, "editor");

  const [current] = await db
    .select()
    .from(pages)
    .where(eq(pages.id, pageId))
    .limit(1);

  if (!current) {
    throw new Error("Page not found");
  }

  const [row] = await db
    .update(pages)
    .set({ isFavorite: !current.isFavorite, updatedAt: sql`now()` })
    .where(eq(pages.id, pageId))
    .returning();

  return toPageRecord(row, role);
}

export async function toggleSpaceFavorite(
  spaceId: number,
): Promise<SpaceRecord> {
  const userId = await requireUserId();
  const role = await requireSpaceAccess(spaceId, userId, "editor");

  const [current] = await db
    .select()
    .from(spaces)
    .where(eq(spaces.id, spaceId))
    .limit(1);

  if (!current) {
    throw new Error("Space not found");
  }

  const [row] = await db
    .update(spaces)
    .set({ isFavorite: !current.isFavorite, updatedAt: sql`now()` })
    .where(eq(spaces.id, spaceId))
    .returning();

  const { pageCount, fileCount } = await getSpaceCounts(spaceId);
  return toSpaceRecord(row, role, pageCount, fileCount);
}

export async function softDeletePage(pageId: number): Promise<void> {
  const userId = await requireUserId();
  await requirePageAccess(pageId, userId, "editor");

  const [page] = await db
    .select()
    .from(pages)
    .where(eq(pages.id, pageId))
    .limit(1);

  if (!page) {
    throw new Error("Page not found");
  }

  const role = await getSpaceRole(page.spaceId, userId);
  if (role !== "owner" && page.clerkId !== userId) {
    throw new Error("Insufficient permissions");
  }

  await db
    .update(pages)
    .set({ deletedAt: sql`now()`, updatedAt: sql`now()` })
    .where(eq(pages.id, pageId));
}

export async function archiveSpace(spaceId: number): Promise<SpaceRecord> {
  return updateSpace(spaceId, { archivedAt: new Date().toISOString() });
}

export async function archivePage(pageId: number): Promise<PageRecord> {
  return updatePage(pageId, { archivedAt: new Date().toISOString() });
}

export async function searchSpacesAndPages(query: string): Promise<{
  spaces: SpaceListItem[];
  pages: PageListItem[];
}> {
  const trimmed = query.trim();
  if (!trimmed) {
    return { spaces: [], pages: [] };
  }

  const spaceItems = await listSpaces({ query: trimmed, filter: "all" });
  const userId = await requireUserId();

  const pageRows = await db
    .select({ page: pages, space: spaces })
    .from(pages)
    .innerJoin(spaces, eq(pages.spaceId, spaces.id))
    .where(
      and(
        isNull(pages.deletedAt),
        isNull(pages.archivedAt),
        isNull(spaces.deletedAt),
        ilike(pages.title, `%${trimmed}%`),
      ),
    )
    .limit(20);

  const pageItems: PageListItem[] = [];
  const editorIds = pageRows.map(
    ({ page }) => page.lastEditedByClerkId ?? page.clerkId,
  );
  const initialsMap = await resolveInitialsForClerkIds(editorIds);

  for (const { page, space } of pageRows) {
    const role = await resolveRoleForSpace(space.id, userId, space.clerkId);
    if (!role) continue;
    pageItems.push(
      pageRowToListItem(
        page,
        role,
        initialsMap.get(page.lastEditedByClerkId ?? page.clerkId) ?? "??",
        space.isVault,
      ),
    );
  }

  return { spaces: spaceItems, pages: pageItems };
}

export async function movePage(
  pageId: number,
  targetSpaceId: number,
): Promise<PageRecord> {
  const userId = await requireUserId();
  await requirePageAccess(pageId, userId, "editor");
  const role = await requireSpaceAccess(targetSpaceId, userId, "editor");

  const [row] = await db
    .update(pages)
    .set({
      spaceId: targetSpaceId,
      lastEditedByClerkId: userId,
      updatedAt: sql`now()`,
    })
    .where(eq(pages.id, pageId))
    .returning();

  if (!row) {
    throw new Error("Page not found");
  }

  await db
    .update(spaces)
    .set({ updatedAt: sql`now()` })
    .where(eq(spaces.id, targetSpaceId));

  return toPageRecord(row, role);
}

export async function renamePage(
  pageId: number,
  title: string,
): Promise<PageRecord> {
  return updatePage(pageId, { title });
}

export async function exportPageJson(pageId: number): Promise<{
  title: string;
  template: string;
  content: TiptapJson;
  exportedAt: string;
}> {
  const userId = await requireUserId();
  await requirePageAccess(pageId, userId, "viewer");

  const [row] = await db
    .select()
    .from(pages)
    .where(eq(pages.id, pageId))
    .limit(1);

  if (!row) {
    throw new Error("Page not found");
  }

  return {
    title: row.title,
    template: row.template,
    content: row.content as TiptapJson,
    exportedAt: new Date().toISOString(),
  };
}
