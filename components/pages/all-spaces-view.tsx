"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Grid3X3, LayoutList, Plus, Search } from "lucide-react";
import {
  archiveSpace,
  createPage,
  createSpace,
  duplicateSpace,
  softDeleteSpace,
  toggleSpaceFavorite,
  updateSpace,
} from "@/lib/pages/actions";
import { useSpacesList } from "@/lib/pages/use-spaces-list";
import type { SpaceFilter, SpaceListItem, SpaceSort } from "@/lib/pages/types";
import { registerVaultOnChain, submitSignedTx } from "@/lib/stellar/contract";
import { getVaultVerifierContractId } from "@/lib/stellar/config";
import { useFreighter } from "@/hooks/use-freighter";
import { KaizenLoadingScreen } from "@/components/loading/kaizen-loading";
import { NewPageDialog } from "@/components/pages/new-page-dialog";
import { PagesSectionHeader } from "@/components/pages/pages-section-header";
import { SpaceCard } from "@/components/pages/space-card";
import { SpaceDialog } from "@/components/pages/space-dialog";
import { Button } from "@/components/retroui/Button";
import { Input } from "@/components/retroui/Input";
import { cn } from "@/lib/utils";

const FILTERS: { id: SpaceFilter; label: string }[] = [
  { id: "all", label: "All Spaces" },
  { id: "favorites", label: "Favorites" },
  { id: "recent", label: "Recently Opened" },
  { id: "archived", label: "Archived" },
];

export function AllSpacesView() {
  const router = useRouter();
  const freighter = useFreighter();
  const {
    spaces,
    loading,
    query,
    setQuery,
    filter,
    setFilter,
    sort,
    setSort,
    refresh,
    patchSpace,
    removeSpace,
  } = useSpacesList();

  const [view, setView] = useState<"grid" | "list">("grid");
  const [createOpen, setCreateOpen] = useState(false);
  const [newPageOpen, setNewPageOpen] = useState(false);
  const [editSpace, setEditSpace] = useState<SpaceListItem | null>(null);

  if (loading) {
    return <KaizenLoadingScreen label="Loading spaces…" />;
  }

  const writableSpaces = spaces.filter(
    (space) => space.role === "owner" || space.role === "editor",
  );

  return (
    <div className="mx-auto max-w-6xl">
      <PagesSectionHeader
        title="Organize every working document by space."
        subtitle={`${spaces.length} ${spaces.length === 1 ? "space" : "spaces"}`}
        actions={
          <>
            <Button variant="outline" onClick={() => setNewPageOpen(true)}>
              <Plus className="size-4" />
              New Page
            </Button>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="size-4" />
              New Space
            </Button>
          </>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <Button
            key={f.id}
            type="button"
            size="sm"
            variant={filter === f.id ? "default" : "outline"}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search spaces or pages…"
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SpaceSort)}
            className="h-9 rounded border-2 border-border bg-background px-2 font-sans text-sm shadow-sm"
            aria-label="Sort spaces"
          >
            <option value="updated">Sort: Updated</option>
            <option value="name">Sort: Name</option>
            <option value="created">Sort: Created</option>
          </select>
          <Button
            type="button"
            size="sm"
            variant="outline"
            aria-label="Grid view"
            onClick={() => setView("grid")}
          >
            <Grid3X3 className={cn("size-4", view === "grid" && "text-primary")} />
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            aria-label="List view"
            onClick={() => setView("list")}
          >
            <LayoutList className={cn("size-4", view === "list" && "text-primary")} />
          </Button>
        </div>
      </div>

      {spaces.length === 0 ? (
        <div className="rounded border-2 border-dashed border-border p-12 text-center shadow-sm">
          <p className="font-sans text-muted-foreground">
            No spaces yet. Create your first space to organize pages and files.
          </p>
          <Button className="mt-4" onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" />
            New Space
          </Button>
        </div>
      ) : (
        <div
          className={cn(
            view === "grid"
              ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
              : "flex flex-col gap-3",
          )}
        >
          {spaces.map((space) => (
            <SpaceCard
              key={space.id}
              space={space}
              view={view}
              onOpen={() => router.push(`/pages/space/${space.id}`)}
              onToggleFavorite={() => {
                void toggleSpaceFavorite(space.id).then((updated) => {
                  patchSpace(space.id, { isFavorite: updated.isFavorite });
                });
              }}
              onRename={() => setEditSpace(space)}
              onDuplicate={() => {
                void duplicateSpace(space.id).then(() => refresh());
              }}
              onArchive={() => {
                void archiveSpace(space.id).then(() => refresh());
              }}
              onDelete={() => {
                void softDeleteSpace(space.id).then(() => {
                  removeSpace(space.id);
                });
              }}
            />
          ))}
        </div>
      )}

      <SpaceDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        mode="create"
        onSubmit={async (values) => {
          const created = await createSpace({
            name: values.name,
            description: values.description,
            color: values.color,
            isVault: values.isVault,
            vaultCommitment: values.vaultCommitment,
            vaultSalt: values.vaultSalt,
          });

          if (
            values.isVault &&
            values.vaultCommitment &&
            getVaultVerifierContractId()
          ) {
            try {
              if (!freighter.connected) await freighter.connect();
              if (freighter.address) {
                const xdr = await registerVaultOnChain(
                  freighter.address,
                  created.id,
                  values.vaultCommitment,
                );
                const signed = await freighter.sign(xdr);
                await submitSignedTx(signed);
              }
            } catch {
              // On-chain registration is best-effort for v1
            }
          }

          await refresh();
        }}
      />

      <SpaceDialog
        open={editSpace !== null}
        onOpenChange={(open) => {
          if (!open) setEditSpace(null);
        }}
        mode="edit"
        initial={editSpace ?? undefined}
        onSubmit={async (values) => {
          if (!editSpace) return;
          await updateSpace(editSpace.id, {
            name: values.name,
            description: values.description,
            color: values.color,
          });
          await refresh();
          setEditSpace(null);
        }}
      />

      <NewPageDialog
        open={newPageOpen}
        onOpenChange={setNewPageOpen}
        spaces={writableSpaces}
        onSubmit={async (values) => {
          const created = await createPage({
            spaceId: values.spaceId,
            title: values.title,
            template: values.template,
          });
          router.push(`/pages/space/${values.spaceId}/${created.id}`);
        }}
      />
    </div>
  );
}
