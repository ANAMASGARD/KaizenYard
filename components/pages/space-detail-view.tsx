"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, FileText, Folder, Lock, Paperclip, Plus, Star } from "lucide-react";
import {
  archivePage,
  createPage,
  duplicatePage,
  exportPageJson,
  getSpace,
  listPagesInSpace,
  listSpaces,
  movePage,
  renamePage,
  softDeletePage,
  togglePageFavorite,
} from "@/lib/pages/actions";
import {
  archiveSpaceFile,
  getSpaceFileDownload,
  listFilesInSpace,
  moveSpaceFile,
  renameSpaceFile,
  softDeleteSpaceFile,
  toggleSpaceFileFavorite,
} from "@/lib/pages/file-actions";
import {
  fileTypeLabel,
  formatFileSize,
  PAGE_TEMPLATE_LABELS,
} from "@/lib/pages/mappers";
import { formatRelativeTime } from "@/lib/notes/date-utils";
import { COLOR_META } from "@/lib/kanban/colors";
import type {
  PageListItem,
  SpaceContentItem,
  SpaceFileListItem,
  SpaceListItem,
  SpaceRecord,
} from "@/lib/pages/types";
import {
  copyPageShareLink,
  downloadBase64File,
  downloadJsonFile,
} from "@/lib/pages/download";
import { isVaultUnlocked } from "@/lib/vault/session";
import { KaizenLoadingScreen } from "@/components/loading/kaizen-loading";
import { NewPageDialog } from "@/components/pages/new-page-dialog";
import {
  FileActionsMenu,
  PageActionsMenu,
} from "@/components/pages/page-actions-menu";
import { PagesSectionHeader } from "@/components/pages/pages-section-header";
import { RenameItemDialog } from "@/components/pages/rename-item-dialog";
import { UploadFileButton } from "@/components/pages/upload-file-button";
import { VaultUnlockDialog } from "@/components/pages/vault-unlock-dialog";
import { Badge } from "@/components/retroui/Badge";
import { Button } from "@/components/retroui/Button";
import { cn } from "@/lib/utils";

type SpaceDetailViewProps = {
  spaceId: number;
};

export function SpaceDetailView({ spaceId }: SpaceDetailViewProps) {
  const router = useRouter();
  const [space, setSpace] = useState<SpaceRecord | null>(null);
  const [pages, setPages] = useState<PageListItem[]>([]);
  const [files, setFiles] = useState<SpaceFileListItem[]>([]);
  const [allSpaces, setAllSpaces] = useState<SpaceListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [vaultOpen, setVaultOpen] = useState(false);
  const [vaultLocked, setVaultLocked] = useState(false);
  const [renamePageTarget, setRenamePageTarget] = useState<PageListItem | null>(
    null,
  );
  const [renameFileTarget, setRenameFileTarget] =
    useState<SpaceFileListItem | null>(null);
  const [shareMessage, setShareMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [spaceData, spaceOptions] = await Promise.all([
      getSpace(spaceId),
      listSpaces({ filter: "all" }),
    ]);
    setAllSpaces(spaceOptions);

    if (!spaceData) {
      setSpace(null);
      setPages([]);
      setFiles([]);
      return;
    }

    const locked = spaceData.isVault && !isVaultUnlocked(spaceId);
    setVaultLocked(locked);
    setSpace(spaceData);

    if (spaceData.isVault && locked) {
      setVaultOpen(true);
    }

    const [pageItems, fileItems] = await Promise.all([
      listPagesInSpace(spaceId, { vaultLocked: locked }),
      locked ? Promise.resolve([]) : listFilesInSpace(spaceId),
    ]);
    setPages(pageItems);
    setFiles(fileItems);
  }, [spaceId]);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) setLoading(true);
    });
    void (async () => {
      const [spaceData, spaceOptions] = await Promise.all([
        getSpace(spaceId),
        listSpaces({ filter: "all" }),
      ]);
      if (cancelled) return;
      setAllSpaces(spaceOptions);
      if (!spaceData) {
        setSpace(null);
        setPages([]);
        setFiles([]);
        setLoading(false);
        return;
      }
      const locked = spaceData.isVault && !isVaultUnlocked(spaceId);
      setVaultLocked(locked);
      setSpace(spaceData);
      if (spaceData.isVault && locked) {
        setVaultOpen(true);
      }
      const [pageItems, fileItems] = await Promise.all([
        listPagesInSpace(spaceId, { vaultLocked: locked }),
        locked ? Promise.resolve([]) : listFilesInSpace(spaceId),
      ]);
      if (cancelled) return;
      setPages(pageItems);
      setFiles(fileItems);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [spaceId]);

  const items = useMemo<SpaceContentItem[]>(() => {
    const pageItems: SpaceContentItem[] = pages.map((page) => ({
      kind: "page",
      ...page,
    }));
    const fileItems: SpaceContentItem[] = files.map((file) => ({
      kind: "file",
      ...file,
    }));
    return [...pageItems, ...fileItems].sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
  }, [pages, files]);

  const canEdit = space?.role === "owner" || space?.role === "editor";
  const meta = space ? COLOR_META[space.color] : COLOR_META.yellow;
  const itemCountLabel =
    space &&
    `${space.pageCount + space.fileCount} ${
      space.pageCount + space.fileCount === 1 ? "item" : "items"
    }`;

  if (loading) {
    return <KaizenLoadingScreen label="Loading space…" />;
  }

  if (!space) {
    return (
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="font-head text-2xl">Space not found</h1>
        <Link
          href="/pages"
          className="mt-4 inline-flex h-10 items-center justify-center rounded border-2 border-border bg-primary px-4 font-head text-sm shadow-sm"
        >
          Back to All Spaces
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        href="/pages"
        className="mb-4 inline-flex items-center gap-1 font-sans text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        All Spaces
      </Link>

      <PagesSectionHeader
        title="Organize every working document by space."
        actions={
          <>
            {space.isVault && vaultLocked ? (
              <Button variant="outline" onClick={() => setVaultOpen(true)}>
                <Lock className="size-4" />
                Unlock Vault
              </Button>
            ) : (
              <>
                <UploadFileButton
                  spaceId={spaceId}
                  disabled={!canEdit || vaultLocked}
                  onUploaded={() => void load()}
                />
                <Button onClick={() => setCreateOpen(true)} disabled={!canEdit}>
                  <Plus className="size-4" />
                  New Page
                </Button>
              </>
            )}
          </>
        }
      />

      <div className="mb-6 flex items-start gap-3">
        <span
          className={cn(
            "flex size-12 shrink-0 items-center justify-center rounded border-2 border-border shadow-sm",
            meta.bgClass,
          )}
        >
          {space.isVault ? (
            <Lock className={cn("size-6", meta.textClass)} />
          ) : (
            <Folder className={cn("size-6", meta.textClass)} />
          )}
        </span>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-head text-xl">{space.name}</h2>
            {space.isVault ? (
              <Badge variant="outline" className="border-2">
                Secure Vault
              </Badge>
            ) : null}
          </div>
          {space.description ? (
            <p className="mt-1 font-sans text-sm text-muted-foreground">
              {space.description}
            </p>
          ) : null}
          <p className="mt-1 font-sans text-xs text-muted-foreground">
            {itemCountLabel}
          </p>
        </div>
      </div>

      {shareMessage ? (
        <p className="mb-4 rounded border-2 border-border bg-primary/20 px-3 py-2 font-sans text-sm shadow-sm">
          {shareMessage}
        </p>
      ) : null}

      {items.length === 0 ? (
        <div className="rounded border-2 border-dashed border-border p-12 text-center shadow-sm">
          <p className="font-sans text-muted-foreground">
            {vaultLocked
              ? "Unlock this vault to view pages and files."
              : "No pages or files yet. Create a page or upload a file."}
          </p>
          {!vaultLocked && canEdit ? (
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="size-4" />
                New Page
              </Button>
              <UploadFileButton spaceId={spaceId} onUploaded={() => void load()} />
            </div>
          ) : null}
        </div>
      ) : (
        <div className="overflow-hidden rounded border-2 border-border shadow-md">
          <table className="w-full font-sans text-sm">
            <thead className="border-b-2 border-border bg-muted/40">
              <tr>
                <th className="px-4 py-2 text-left font-head text-[10px] uppercase tracking-[0.2em]">
                  Page Name
                </th>
                <th className="hidden px-4 py-2 text-left font-head text-[10px] uppercase tracking-[0.2em] sm:table-cell">
                  Type
                </th>
                <th className="hidden px-4 py-2 text-left font-head text-[10px] uppercase tracking-[0.2em] md:table-cell">
                  Updated
                </th>
                <th className="px-4 py-2 text-right font-head text-[10px] uppercase tracking-[0.2em]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                if (item.kind === "page") {
                  return (
                    <tr
                      key={`page-${item.id}`}
                      className="border-b border-border last:border-b-0 hover:bg-muted/20"
                    >
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          className="flex items-start gap-3 text-left"
                          onClick={() => {
                            if (vaultLocked) {
                              setVaultOpen(true);
                              return;
                            }
                            router.push(`/pages/space/${spaceId}/${item.id}`);
                          }}
                        >
                          <FileText className="mt-0.5 size-4 shrink-0 text-sky-600" />
                          <span>
                            <span className="block font-medium hover:underline">
                              {item.title}
                            </span>
                            <span className="font-sans text-[11px] text-muted-foreground">
                              By {item.authorInitials}
                            </span>
                          </span>
                        </button>
                      </td>
                      <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                        {PAGE_TEMPLATE_LABELS[item.template]}
                      </td>
                      <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                        {formatRelativeTime(item.updatedAt)}
                      </td>
                      <td className="px-4 py-3">
                        {!vaultLocked ? (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              aria-label={
                                item.isFavorite ? "Unfavorite page" : "Favorite page"
                              }
                              onClick={() => {
                                void togglePageFavorite(item.id).then(() => load());
                              }}
                              className={cn(
                                "rounded border-2 border-border px-1.5 py-0.5 text-xs shadow-sm",
                                item.isFavorite
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-background",
                              )}
                            >
                              <Star
                                className={cn(
                                  "size-3.5",
                                  item.isFavorite && "fill-current",
                                )}
                              />
                            </button>
                            <PageActionsMenu
                              canEdit={canEdit}
                              spaces={allSpaces}
                              currentSpaceId={spaceId}
                              isFavorite={item.isFavorite}
                              onRename={() => setRenamePageTarget(item)}
                              onMove={(targetSpaceId) => {
                                void movePage(item.id, targetSpaceId).then(() => {
                                  void load();
                                });
                              }}
                              onDuplicate={() => {
                                void duplicatePage(item.id).then(() => load());
                              }}
                              onToggleFavorite={() => {
                                void togglePageFavorite(item.id).then(() => load());
                              }}
                              onShare={() => {
                                void copyPageShareLink(spaceId, item.id).then(() => {
                                  setShareMessage("Page link copied to clipboard.");
                                  setTimeout(() => setShareMessage(null), 2500);
                                });
                              }}
                              onExport={() => {
                                void exportPageJson(item.id).then((payload) => {
                                  downloadJsonFile(item.title, payload);
                                });
                              }}
                              onArchive={() => {
                                void archivePage(item.id).then(() => load());
                              }}
                              onDelete={() => {
                                void softDeletePage(item.id).then(() => load());
                              }}
                            />
                          </div>
                        ) : null}
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr
                    key={`file-${item.id}`}
                    className="border-b border-border last:border-b-0 hover:bg-muted/20"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-start gap-3">
                        <Paperclip className="mt-0.5 size-4 shrink-0 text-amber-600" />
                        <span>
                          <span className="block font-medium">{item.name}</span>
                          <span className="font-sans text-[11px] text-muted-foreground">
                            By {item.authorInitials} · {formatFileSize(item.sizeBytes)}
                          </span>
                        </span>
                      </div>
                    </td>
                    <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                      {fileTypeLabel(item.mimeType)}
                    </td>
                    <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                      {formatRelativeTime(item.updatedAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          aria-label={
                            item.isFavorite ? "Unfavorite file" : "Favorite file"
                          }
                          onClick={() => {
                            void toggleSpaceFileFavorite(item.id).then(() => load());
                          }}
                          className={cn(
                            "rounded border-2 border-border px-1.5 py-0.5 text-xs shadow-sm",
                            item.isFavorite
                              ? "bg-primary text-primary-foreground"
                              : "bg-background",
                          )}
                        >
                          <Star
                            className={cn(
                              "size-3.5",
                              item.isFavorite && "fill-current",
                            )}
                          />
                        </button>
                        <FileActionsMenu
                          canEdit={canEdit}
                          spaces={allSpaces}
                          currentSpaceId={spaceId}
                          isFavorite={item.isFavorite}
                          onRename={() => setRenameFileTarget(item)}
                          onMove={(targetSpaceId) => {
                            void moveSpaceFile(item.id, targetSpaceId).then(() => {
                              void load();
                            });
                          }}
                          onDownload={() => {
                            void getSpaceFileDownload(item.id).then((payload) => {
                              downloadBase64File(
                                payload.name,
                                payload.mimeType,
                                payload.dataBase64,
                              );
                            });
                          }}
                          onToggleFavorite={() => {
                            void toggleSpaceFileFavorite(item.id).then(() => load());
                          }}
                          onArchive={() => {
                            void archiveSpaceFile(item.id).then(() => load());
                          }}
                          onDelete={() => {
                            void softDeleteSpaceFile(item.id).then(() => load());
                          }}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <NewPageDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        defaultSpaceId={spaceId}
        spaceName={space.name}
        onSubmit={async (values) => {
          const created = await createPage({
            spaceId: values.spaceId,
            title: values.title,
            template: values.template,
          });
          router.push(`/pages/space/${spaceId}/${created.id}`);
        }}
      />

      <RenameItemDialog
        open={renamePageTarget !== null}
        onOpenChange={(open) => {
          if (!open) setRenamePageTarget(null);
        }}
        title="Rename Page"
        label="Page Name"
        initialName={renamePageTarget?.title ?? ""}
        onSubmit={async (name) => {
          if (!renamePageTarget) return;
          await renamePage(renamePageTarget.id, name);
          await load();
        }}
      />

      <RenameItemDialog
        open={renameFileTarget !== null}
        onOpenChange={(open) => {
          if (!open) setRenameFileTarget(null);
        }}
        title="Rename File"
        label="File Name"
        initialName={renameFileTarget?.name ?? ""}
        onSubmit={async (name) => {
          if (!renameFileTarget) return;
          await renameSpaceFile(renameFileTarget.id, name);
          await load();
        }}
      />

      {space.isVault && space.vaultCommitment && space.vaultSalt ? (
        <VaultUnlockDialog
          open={vaultOpen}
          onOpenChange={setVaultOpen}
          spaceId={spaceId}
          spaceName={space.name}
          vaultSalt={space.vaultSalt}
          vaultCommitment={space.vaultCommitment}
          onUnlocked={() => {
            setVaultLocked(false);
            void load();
          }}
        />
      ) : null}
    </div>
  );
}
