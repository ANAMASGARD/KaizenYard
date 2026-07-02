"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ClientSideSuspense,
  LiveblocksProvider,
  RoomProvider,
} from "@liveblocks/react/suspense";
import { FileText, Menu } from "lucide-react";
import {
  duplicateNote,
  getNote,
  softDeleteNote,
} from "@/lib/notes/actions";
import { noteRecordToListItem } from "@/lib/notes/mappers";
import { notePageRoomId } from "@/lib/notes/room";
import { useNotesList } from "@/lib/notes/use-notes-list";
import type { NoteRecord } from "@/lib/notes/types";
import "@/lib/liveblocks/config";
import { CollaborationPanel } from "@/components/notes/collaboration-panel";
import { NoteEditor } from "@/components/notes/note-editor";
import { NotesSidebar } from "@/components/notes/notes-sidebar";
import { Button } from "@/components/retroui/Button";
import { Drawer } from "@/components/retroui/Drawer";

function NotesPageContent() {
  const {
    notes,
    loading,
    query,
    setQuery,
    refresh,
    addNote,
    patchNote,
    removeNote,
    createNoteItem,
  } = useNotesList();

  const [activeNoteId, setActiveNoteId] = useState<number | null>(null);
  const [activeNote, setActiveNote] = useState<NoteRecord | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [collaborationOpen, setCollaborationOpen] = useState(false);

  const loadActiveNote = useCallback(async (noteId: number) => {
    const note = await getNote(noteId);
    setActiveNote(note);
    return note;
  }, []);

  useEffect(() => {
    if (loading || activeNoteId !== null || notes.length === 0) return;
    const firstId = notes[0].id;
    setActiveNoteId(firstId);
    void loadActiveNote(firstId);
  }, [activeNoteId, loadActiveNote, loading, notes]);

  async function selectNote(noteId: number) {
    setActiveNoteId(noteId);
    setMobileSidebarOpen(false);
    await loadActiveNote(noteId);
  }

  function handleNoteDeleted(noteId: number) {
    const remaining = notes.filter((n) => n.id !== noteId);
    removeNote(noteId);

    if (activeNoteId !== noteId) return;

    const fallback = remaining[0]?.id ?? null;
    setActiveNoteId(fallback);
    if (fallback) {
      void loadActiveNote(fallback);
    } else {
      setActiveNote(null);
    }
  }

  function handleTitleUpdated(noteId: number, title: string, updatedAt: string) {
    patchNote(noteId, { title, updatedAt });
    setActiveNote((prev) =>
      prev && prev.id === noteId ? { ...prev, title, updatedAt } : prev,
    );
  }

  function handlePinnedUpdated(noteId: number, pinned: boolean) {
    patchNote(noteId, { pinned });
    setActiveNote((prev) =>
      prev && prev.id === noteId ? { ...prev, pinned } : prev,
    );
  }

  async function handleDuplicate() {
    if (!activeNoteId) return;
    try {
      const dup = await duplicateNote(activeNoteId);
      addNote(noteRecordToListItem(dup));
      await selectNote(dup.id);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to duplicate note");
    }
  }

  async function handleDelete() {
    if (!activeNote) return;
    if (!confirm(`Move "${activeNote.title}" to trash?`)) return;
    try {
      await softDeleteNote(activeNote.id);
      handleNoteDeleted(activeNote.id);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete note");
    }
  }

  async function handleEmptyCreate() {
    try {
      const item = await createNoteItem();
      await selectNote(item.id);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create note");
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center font-sans text-sm text-muted-foreground">
        Loading notes…
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="flex items-center justify-between gap-2 lg:hidden">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setMobileSidebarOpen(true)}
        >
          <Menu className="size-4" />
          Notes
        </Button>
      </div>

      <div className="flex min-h-0 flex-1 gap-3">
        <NotesSidebar
          notes={notes}
          activeNoteId={activeNoteId}
          query={query}
          onQueryChange={setQuery}
          onRefresh={() => void refresh(query.trim() || undefined)}
          onPatchNote={patchNote}
          onSelectNote={(id) => void selectNote(id)}
          onNoteCreated={addNote}
          onNoteDeleted={handleNoteDeleted}
          onCreateNote={() => createNoteItem()}
          className="hidden lg:flex"
        />

        <section className="flex min-h-0 min-w-0 flex-1 flex-col rounded border-2 border-border bg-background shadow-md">
          {activeNote && activeNoteId ? (
            <RoomProvider id={notePageRoomId(activeNoteId)}>
              <ClientSideSuspense
                fallback={
                  <div className="flex flex-1 items-center justify-center font-sans text-sm text-muted-foreground">
                    Connecting…
                  </div>
                }
              >
                <NoteEditor
                  note={activeNote}
                  onTitleUpdated={(title, updatedAt) =>
                    handleTitleUpdated(activeNote.id, title, updatedAt)
                  }
                  onPinnedUpdated={(pinned) =>
                    handlePinnedUpdated(activeNote.id, pinned)
                  }
                  onDuplicate={() => void handleDuplicate()}
                  onDelete={() => void handleDelete()}
                  onShare={() => setCollaborationOpen(true)}
                />
              </ClientSideSuspense>
            </RoomProvider>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
              <FileText className="size-12 text-muted-foreground" />
              <div>
                <p className="font-head text-lg">No note selected</p>
                <p className="mt-1 font-sans text-sm text-muted-foreground">
                  Create a note to start writing, dictating, and collaborating.
                </p>
              </div>
              <Button type="button" onClick={() => void handleEmptyCreate()}>
                New Note
              </Button>
            </div>
          )}
        </section>
      </div>

      <Drawer open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
        <Drawer.Content className="inset-y-0 left-0 right-auto mt-0 h-full max-h-screen w-[min(18rem,85vw)] max-w-none rounded-none border-r-2 border-t-0 p-0">
          <NotesSidebar
            notes={notes}
            activeNoteId={activeNoteId}
            query={query}
            onQueryChange={setQuery}
            onRefresh={() => void refresh(query.trim() || undefined)}
            onPatchNote={patchNote}
            onSelectNote={(id) => void selectNote(id)}
            onNoteCreated={addNote}
            onNoteDeleted={handleNoteDeleted}
            onCreateNote={() => createNoteItem()}
            className="h-full w-full rounded-none border-0 shadow-none"
          />
        </Drawer.Content>
      </Drawer>

      {activeNote ? (
        <CollaborationPanel
          noteId={activeNote.id}
          isOwner={activeNote.role === "owner"}
          open={collaborationOpen}
          onOpenChange={setCollaborationOpen}
        />
      ) : null}
    </div>
  );
}

export function NotesPage() {
  return (
    <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
      <NotesPageContent />
    </LiveblocksProvider>
  );
}
