"use client";

import { useCallback, useState } from "react";
import { Trash2 } from "lucide-react";
import {
  emptyTrash,
  listNotes,
  permanentDeleteNote,
  restoreNote,
} from "@/lib/notes/actions";
import type { NoteListItem } from "@/lib/notes/types";
import { noteRecordToListItem } from "@/lib/notes/mappers";
import { Button } from "@/components/retroui/Button";
import { NoteListItemRow } from "@/components/notes/note-list-item";
import { cn } from "@/lib/utils";

type TrashPanelProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRestored: (note: NoteListItem) => void;
  onEmptied: () => void;
};

export function TrashPanel({
  open,
  onOpenChange,
  onRestored,
  onEmptied,
}: TrashPanelProps) {
  const [items, setItems] = useState<NoteListItem[]>([]);
  const [loading, setLoading] = useState(false);

  const loadTrash = useCallback(async () => {
    setLoading(true);
    try {
      const trashed = await listNotes({ trash: true });
      setItems(trashed);
    } finally {
      setLoading(false);
    }
  }, []);

  function handleOpenChange(next: boolean) {
    onOpenChange(next);
    if (next) void loadTrash();
  }

  async function handleRestore(noteId: number) {
    try {
      const restored = await restoreNote(noteId);
      setItems((prev) => prev.filter((n) => n.id !== noteId));
      onRestored(noteRecordToListItem(restored));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to restore note");
    }
  }

  async function handleDeleteForever(noteId: number) {
    if (!confirm("Permanently delete this note?")) return;
    try {
      await permanentDeleteNote(noteId);
      setItems((prev) => prev.filter((n) => n.id !== noteId));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete note");
    }
  }

  async function handleEmptyTrash() {
    if (!confirm("Empty trash? This cannot be undone.")) return;
    try {
      await emptyTrash();
      setItems([]);
      onEmptied();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to empty trash");
    }
  }

  if (!open) return null;

  return (
    <div className="flex flex-col gap-2 border-t-2 border-border pt-3">
      <div className="flex items-center justify-between gap-2">
        <p className="font-head text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          Trash
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 px-2 text-xs"
          onClick={() => handleOpenChange(false)}
        >
          Back
        </Button>
      </div>

      {loading ? (
        <p className="px-2 py-2 font-sans text-xs text-muted-foreground">
          Loading…
        </p>
      ) : items.length === 0 ? (
        <p className="px-2 py-2 font-sans text-xs text-muted-foreground">
          Trash is empty.
        </p>
      ) : (
        <div className="flex max-h-48 flex-col gap-1 overflow-y-auto">
          {items.map((note) => (
            <div
              key={note.id}
              className="flex items-center gap-1 rounded border-2 border-border bg-muted/30 p-1"
            >
              <div className="min-w-0 flex-1">
                <NoteListItemRow
                  note={note}
                  active={false}
                  onSelect={() => {}}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 shrink-0 px-2 text-xs"
                onClick={() => void handleRestore(note.id)}
              >
                Restore
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className={cn("h-7 shrink-0 px-2 text-xs")}
                onClick={() => void handleDeleteForever(note.id)}
                aria-label="Delete forever"
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {items.length > 0 ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full text-xs"
          onClick={() => void handleEmptyTrash()}
        >
          Empty trash
        </Button>
      ) : null}
    </div>
  );
}
