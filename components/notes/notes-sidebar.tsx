"use client";

import {
  Copy,
  Palette,
  PanelLeftClose,
  Pin,
  Plus,
  Search,
  Tag,
  Trash2,
} from "lucide-react";
import {
  duplicateNote,
  setNoteCategory,
  setNoteColor,
  softDeleteNote,
  togglePin,
  updateNote,
} from "@/lib/notes/actions";
import { noteRecordToListItem } from "@/lib/notes/mappers";
import { getNoteCapabilities } from "@/lib/notes/permissions";
import type { KanbanColor } from "@/lib/kanban/colors";
import type { NoteListItem } from "@/lib/notes/types";
import { Button } from "@/components/retroui/Button";
import { ContextMenu } from "@/components/retroui/ContextMenu";
import { Input } from "@/components/retroui/Input";
import { Popover } from "@/components/retroui/Popover";
import { ColorSwatchPicker } from "@/components/notes/color-swatch-picker";
import { useUserCategories } from "@/lib/settings/use-user-categories";
import { fallbackCategoryMeta } from "@/lib/settings/category-resolver";
import { NoteListItemRow } from "@/components/notes/note-list-item";
import { TrashPanel } from "@/components/notes/trash-panel";
import { cn } from "@/lib/utils";
import { useState } from "react";

type NotesSidebarProps = {
  notes: NoteListItem[];
  activeNoteId: number | null;
  query: string;
  onQueryChange: (query: string) => void;
  onRefresh: () => void;
  onPatchNote: (noteId: number, patch: Partial<NoteListItem>) => void;
  onSelectNote: (noteId: number) => void;
  onNoteCreated: (note: NoteListItem) => void;
  onNoteDeleted: (noteId: number) => void;
  onCreateNote: () => Promise<NoteListItem>;
  onCollapse?: () => void;
  className?: string;
};

export function NotesSidebar({
  notes,
  activeNoteId,
  query,
  onQueryChange,
  onRefresh,
  onPatchNote,
  onSelectNote,
  onNoteCreated,
  onNoteDeleted,
  onCreateNote,
  onCollapse,
  className,
}: NotesSidebarProps) {
  const [trashOpen, setTrashOpen] = useState(false);
  const [colorNoteId, setColorNoteId] = useState<number | null>(null);
  const [categoryNoteId, setCategoryNoteId] = useState<number | null>(null);
  const { categories, metaByKey } = useUserCategories("notes");

  async function handleNewNote() {
    try {
      const item = await onCreateNote();
      onSelectNote(item.id);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create note");
    }
  }

  async function handleRename(note: NoteListItem) {
    const title = prompt("Rename note", note.title);
    if (!title?.trim()) return;
    try {
      const saved = await updateNote(note.id, { title: title.trim() });
      onPatchNote(note.id, {
        title: saved.title,
        updatedAt: saved.updatedAt,
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to rename note");
    }
  }

  async function handleDuplicate(noteId: number) {
    try {
      const dup = await duplicateNote(noteId);
      const item = noteRecordToListItem(dup);
      onNoteCreated(item);
      onSelectNote(dup.id);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to duplicate note");
    }
  }

  async function handleTogglePin(noteId: number) {
    try {
      const saved = await togglePin(noteId);
      onPatchNote(noteId, {
        pinned: saved.pinned,
        updatedAt: saved.updatedAt,
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to pin note");
    }
  }

  async function handleCategoryChange(noteId: number, categoryKey: string | null) {
    try {
      const saved = await setNoteCategory(noteId, categoryKey);
      onPatchNote(noteId, {
        categoryKey: saved.categoryKey,
        updatedAt: saved.updatedAt,
      });
      setCategoryNoteId(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update category");
    }
  }

  async function handleColorChange(noteId: number, color: KanbanColor) {
    try {
      const saved = await setNoteColor(noteId, color);
      onPatchNote(noteId, {
        color: saved.color,
        updatedAt: saved.updatedAt,
      });
      setColorNoteId(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update color");
    }
  }

  async function handleDelete(note: NoteListItem) {
    if (!confirm(`Move "${note.title}" to trash?`)) return;
    try {
      await softDeleteNote(note.id);
      onNoteDeleted(note.id);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete note");
    }
  }

  return (
    <aside
      className={cn(
        "flex w-56 shrink-0 flex-col gap-3 border-2 border-border rounded bg-background p-3 shadow-md lg:w-64",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="font-head text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          Notes
        </p>
        <div className="flex items-center gap-1">
          {onCollapse ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 w-7 shrink-0 p-0 shadow-none"
              onClick={onCollapse}
              aria-label="Collapse notes list"
              title="Collapse sidebar"
            >
              <PanelLeftClose className="size-3.5" />
            </Button>
          ) : null}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => void handleNewNote()}
          >
            <Plus className="size-3.5" />
            New
          </Button>
        </div>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search notes…"
          className="h-8 pl-8 text-sm"
        />
      </div>

      {!trashOpen ? (
        <nav className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto">
          {notes.length === 0 ? (
            <p className="px-2 py-4 font-sans text-xs text-muted-foreground">
              No notes yet. Create one to get started.
            </p>
          ) : (
            notes.map((note) => {
              const { canEdit, canTrash } = getNoteCapabilities(note.role);

              return (
                <ContextMenu key={note.id}>
                  <ContextMenu.Trigger
                    render={
                      <div>
                        <NoteListItemRow
                          note={note}
                          active={note.id === activeNoteId}
                          onSelect={() => onSelectNote(note.id)}
                        />
                      </div>
                    }
                  />
                  <ContextMenu.Content>
                    {canEdit ? (
                      <>
                        <ContextMenu.Item onClick={() => void handleRename(note)}>
                          Rename
                        </ContextMenu.Item>
                        <ContextMenu.Item
                          onClick={() => void handleDuplicate(note.id)}
                        >
                          <Copy className="size-3.5" />
                          Duplicate
                        </ContextMenu.Item>
                        <ContextMenu.Item
                          onClick={() => void handleTogglePin(note.id)}
                        >
                          <Pin className="size-3.5" />
                          {note.pinned ? "Unpin" : "Pin"}
                        </ContextMenu.Item>
                        <ContextMenu.Item onClick={() => setColorNoteId(note.id)}>
                          <Palette className="size-3.5" />
                          Change color
                        </ContextMenu.Item>
                        <ContextMenu.Item onClick={() => setCategoryNoteId(note.id)}>
                          <Tag className="size-3.5" />
                          Set category
                        </ContextMenu.Item>
                      </>
                    ) : null}
                    {canTrash ? (
                      <ContextMenu.Item
                        onClick={() => void handleDelete(note)}
                        className="text-red-600"
                      >
                        <Trash2 className="size-3.5" />
                        Move to trash
                      </ContextMenu.Item>
                    ) : null}
                  </ContextMenu.Content>
                </ContextMenu>
              );
            })
          )}
        </nav>
      ) : null}

      <TrashPanel
        open={trashOpen}
        onOpenChange={setTrashOpen}
        onRestored={(note) => {
          onNoteCreated(note);
          onRefresh();
        }}
        onEmptied={onRefresh}
      />

      {!trashOpen ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2 text-xs"
          onClick={() => setTrashOpen(true)}
        >
          <Trash2 className="size-3.5" />
          Trash
        </Button>
      ) : null}

      {colorNoteId !== null ? (
        <Popover
          open
          onOpenChange={(open) => {
            if (!open) setColorNoteId(null);
          }}
        >
          <Popover.Trigger render={<span className="sr-only">Color</span>} />
          <Popover.Content className="p-3">
            <ColorSwatchPicker
              value={notes.find((n) => n.id === colorNoteId)?.color ?? "yellow"}
              onChange={(color) => void handleColorChange(colorNoteId, color)}
              compact
            />
          </Popover.Content>
        </Popover>
      ) : null}

      {categoryNoteId !== null ? (
        <Popover
          open
          onOpenChange={(open) => {
            if (!open) setCategoryNoteId(null);
          }}
        >
          <Popover.Trigger render={<span className="sr-only">Category</span>} />
          <Popover.Content className="max-w-xs p-3">
            <div className="mb-2 flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded border-2 border-border px-2 py-1 text-xs shadow-sm"
                onClick={() => void handleCategoryChange(categoryNoteId, null)}
              >
                None
              </button>
              {categories.map((category) => {
                const meta = metaByKey[category.key] ?? fallbackCategoryMeta(category.key);
                return (
                  <button
                    key={category.key}
                    type="button"
                    className={`rounded border-2 border-border px-2 py-1 text-xs shadow-sm ${meta.bgClass} ${meta.textClass}`}
                    onClick={() => void handleCategoryChange(categoryNoteId, category.key)}
                  >
                    {meta.label}
                  </button>
                );
              })}
            </div>
          </Popover.Content>
        </Popover>
      ) : null}
    </aside>
  );
}
