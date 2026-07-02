/**
 * Notes persistence contract:
 *
 * - **Body (Tiptap JSON):** Liveblocks Yjs document is the live source of truth.
 *   Postgres `notes.content` stores debounced snapshots for recovery and listing previews.
 *
 * - **Title, pin, color:** Postgres only — updated via debounced autosave, not Yjs.
 *
 * - **Soft delete:** `deletedAt` on Postgres; collaborators lose access when trashed.
 */

export const NOTE_AUTOSAVE_DEBOUNCE_MS = 800;

export const EMPTY_TIPTAP_DOC = {
  type: "doc",
  content: [],
} as const;
