/**
 * Whiteboard persistence contract:
 *
 * - **Scene (elements, appState, files):** Liveblocks Yjs is the live source of truth.
 *   Postgres `whiteboards.content` stores debounced snapshots.
 *
 * - **Title, pin, color:** Postgres only — not Yjs.
 *
 * - **Soft delete:** `deletedAt` on Postgres; collaborators lose access when trashed.
 */

export const WHITEBOARD_AUTOSAVE_DEBOUNCE_MS = 800;

export { EMPTY_WHITEBOARD_SCENE } from "@/lib/whiteboard/scene";
