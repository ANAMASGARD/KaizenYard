# Kaizenyard — session memory

Last updated: 2026-07-02 (Chapter 10 settings hub shipped)

## Product direction

- **Kaizenyard** = privacy-first **Web3 productivity app** on **Stellar**
- Flagship roadmap feature: **anonymous attestation** — feedback provably from a verified group member, without revealing identity
- **Shipped Web3 feature:** **ZK Secure Vaults** in Pages & Spaces — Groth16 (bls12381) unlock proofs + Soroban `vault_verifier` on testnet via **Freighter** and **`@stellar/stellar-sdk`**
- Planned roadmap chapters: setup → auth → dashboard → calendar → kanban → notes → whiteboard → spaces → attestation → AI assistant
- **Chapters 4–10 implemented** (calendar, kanban, notes, whiteboard, pages/spaces + vaults, AI template builder, settings hub); landing roadmap grid may lag

## Agent skills (`.agents/skills/`)

Repo-local Stellar/Web3 + DB skills for coding agents. **Read before changing that domain.**

| Skill | Path | Scope |
|-------|------|--------|
| dapp | `.agents/skills/dapp/SKILL.md` | `@stellar/stellar-sdk`, Freighter, tx simulate/sign/submit, Next.js dApp patterns |
| smart-contracts | `.agents/skills/smart-contracts/` | Soroban Rust, build/deploy, development/testing/security companions |
| zk-proofs | `.agents/skills/zk-proofs/SKILL.md` | Groth16, Circom/snarkjs, BLS12-381 CAP-0059, verifier contracts |
| assets | `.agents/skills/assets/SKILL.md` | Classic assets, trustlines, SAC |
| data | `.agents/skills/data/SKILL.md` | Stellar RPC, Horizon, chain reads |
| agentic-payments | `.agents/skills/agentic-payments/SKILL.md` | x402, MPP (future) |
| standards | `.agents/skills/standards/SKILL.md` | SEPs, CAPs, ecosystem |
| drizzle-best-practices | `.agents/skills/drizzle-best-practices/SKILL.md` | Drizzle v1 RC + Postgres |

Also documented in root **`AGENTS.md`** (product + layout + skills routing table).

## Web3 / Stellar (Chapter 8 vaults)

### Stack

- **`@stellar/stellar-sdk`** — RPC, contract invoke XDR, simulate/submit (`lib/stellar/contract.ts`)
- **`@stellar/freighter-api`** — wallet (`hooks/use-freighter.ts`)
- **`snarkjs`** — browser prover (`lib/vault/prover.ts`)
- **Soroban:** `contracts/vault_verifier/` (`register_vault`, `verify_unlock`)
- **Circom:** `circuits/vault_unlock/vault_unlock.circom` (compile `-p bls12381`)
- **Build script:** `scripts/build-vault-zk.sh` → `public/zk/` (wasm + zkey, not always committed)

### Env

`NEXT_PUBLIC_STELLAR_NETWORK`, `NEXT_PUBLIC_SOROBAN_RPC_URL`, `NEXT_PUBLIC_VAULT_VERIFIER_CONTRACT_ID`

### Hackathon

README **Stellar Hacks: Real-World ZK** section — architecture diagram, deploy steps, 2–3 min demo script.

### Gaps (judges / production)

- Contract deploy to testnet + env contract ID may be unset
- Full Groth16 pairing verify in contract (v1 is policy-layer + commitment/nullifier check)
- ZK artifacts optional until `build-vault-zk.sh` run

## What was built (landing + auth)

### Marketing landing page (`/`)

Replaced placeholder home with a full neo-brutalist marketing site:

1. **Hero** — full-screen background video, transparent fixed navbar, minimal copy (headline + meta + one-line description + 3 stats). No CTA buttons in hero.
2. **Features** — 6 RetroUI cards (attestation, privacy, productivity tools, collaboration, voice, spaces)
3. **Attestation** — yellow section, promise card, 3-step flow
4. **Roadmap** — 10-item dev chapter grid (setup/auth/dashboard/calendar marked done)
5. **Privacy** — inverted contrast section, 3 pillars, sign-up CTA
6. **Footer**

### Navbar behavior

- Transparent over hero, white logo/links/hamburger
- RetroUI Sign in (outline) + Get started (yellow) when signed out; `UserButton` when signed in
- On scroll: solid bar with `bg-background` + `border-border`
- Mobile: full-screen menu with staggered link animations
- **Theme toggle** in desktop auth row + mobile drawer header (sun/moon)

### Auth flow (current)

- **Redirect only** — `SignInButton` / `SignUpButton` with `mode="redirect"`
- Routes: `/sign-in`, `/sign-up` (Clerk components)
- After auth: redirect to `/dashboard` (`forceRedirectUrl` + `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` / `AFTER_SIGN_UP_URL`)
- Each auth route has a minimal layout with `← Kaizenyard` back link + theme toggle top-right
- Root layout removed `AuthHeader`; landing has its own navbar
- Tried modal/glass auth overlay once — **reverted** per user request; keep route-based auth

### Supporting changes

- `app/globals.css` — hero animation keyframes + semantic light/dark CSS variables
- `app/layout.tsx` — `ThemeProvider`, `ClerkProviderThemed`, `ThemedToaster`, Kaizenyard metadata
- `components/user-sync.tsx` + `lib/sync-user.ts` — upsert Clerk users to `users` table (moved to `app/(app)/layout.tsx`)
- `db/schema.ts` + migrations — `users` table with `clerkId`, `email`, `name`, timestamps

## Dashboard layout (Chapter 3 — done)

### App shell

- Route group `app/(app)/` with `DashboardShell` layout
- **Protected routes** in `proxy.ts`: `/dashboard`, `/assistant`, `/calendar`, `/tasks`, `/notes`, `/whiteboard`, `/pages`, `/templates`, `/settings`
- Skeleton pages only — RetroUI `Card` + “Coming soon” placeholder per route (except **Calendar**, **Tasks/Kanban**, **Notes**, **Whiteboard**, **Pages & Spaces**, **AI Template Builder**, and **Settings** — full features)
- **Settings** — multi-section hub at `/settings` (profile, preferences, categories, AI, notifications, calendar, data export, privacy, integrations, about); Clerk account at `/settings/account`
- **Theme toggle** — mobile top bar right; desktop fixed `top-5 right-5`

### Sidebar (`components/dashboard/`)

- Neo-brutalist RetroUI: `border-2 border-border`, yellow active state, colorful Lucide icons
- Grouped nav: Workspace, Productivity, Create, Account
- Collapsible desktop sidebar (`w-60` ↔ icon rail `w-[4.25rem]`), persisted in `localStorage` (hydration-safe store)
- Mobile: neo-brutalist hamburger top bar + RetroUI `Drawer` (left, `swipeDirection="left"`, `Viewport` wrapper)
- Search: RetroUI `Command.Dialog` — jump to nav routes, `⌘K` shortcut
- Profile footer: Clerk `UserButton`, masked email (`lib/mask-email.ts`), `SignOutButton`
- **No `OrganizationSwitcher`** until Clerk Organizations is enabled in dashboard (was causing dev popup)
- Collapse toggle: `NeoHamburgerButton` — bordered hamburger, not panel icons
- Collapsed rail: `sidebar-rail.ts` shared classes — no hard shadows (prevents clip/overflow)

### Shared brand

- `components/brand/logo.tsx` — extracted from landing navbar

### RetroUI fixes touched

- `Drawer.tsx` — `Popup` wrapped in `Viewport` (Base UI requirement)
- `Tooltip.tsx` — `Popup` wrapped in `Positioner` (Base UI requirement)

## Calendar (Chapter 4 + v2 corporate features — done)

### Data

- `calendar_items` — extended with description, location, recurrenceRule, buffers, isPrivate, attendeeCount
- `calendar_item_exceptions` — per-occurrence edit/delete for recurring series
- `calendar_settings` — focus goal, no-meeting days, work hours, hourly rate
- `calendar_meeting_pulses` + `calendar_pulse_votes` — anonymous meeting pulse (HMAC voter tokens)

### Features

- **Category color swatch picker** in create/edit dialog
- **Keyboard drag-and-drop** (KeyboardSensor + a11y announcements)
- **Recurring events** via `rrule` (daily/weekdays/weekly/monthly/yearly) with this-event vs all-events scope
- **Description, location, buffers, private flag, attendee count**
- **Meeting cost calculator** in dialog
- **Focus time + fragmentation summary** toolbar panel
- **Calendar settings** popover (focus goal, no-meeting days, hourly rate)
- **ICS export** at `/calendar/export` (private items redacted as "Busy")
- **Undo toasts** for delete/unschedule; **`c` quick-add** shortcut
- **Anonymous Meeting Pulse** — share link `/calendar/pulse/[token]`, HMAC-anonymous votes
- Client-first calendar page with mount-time fetch; `useNowMs` stable snapshot (no infinite loop)

### Files

```
lib/calendar/
  actions.ts, categories.ts, date-utils.ts, types.ts
  recurrence.ts, focus-utils.ts, ics.ts, pulse-actions.ts

components/calendar/
  category-swatch-picker.tsx, calendar-settings-popover.tsx
  focus-summary.tsx, meeting-pulse-panel.tsx, scope-prompt.tsx
  (+ month/week/toolbar/draft/chip/dialog views)

app/(app)/calendar/export/route.ts
app/(app)/calendar/pulse/[token]/page.tsx
```

## Kanban / Tasks (Chapter 5 + differentiators — done)

### Data

- `kanban_boards` — per-user boards (name, color, sort order)
- `kanban_columns` — up to 5 columns per board (name, color, sort order)
- `kanban_tasks` — title, description, due date, priority, labels, calendar sync (`calendarItemId`), `linkNotes` flag, sort order
- `kanban_task_pulses` + `kanban_task_pulse_votes` — anonymous task risk check-ins (HMAC voter tokens, same `CALENDAR_PULSE_SECRET` as meeting pulse)
- `kanban_automations` — per-board Butler-style trigger→action rules (jsonb configs)
- `kanban_board_collaborators` — board sharing by email (editor/viewer roles, pending until invitee signs up)

Migrations: `20260701155506_icy_timeslip` (core kanban), `20260701162208_warm_polaris` (pulse + automations), `20260701165253_clean_famine` (board collaborators)

### Core Kanban features

- Multi-board sidebar, create/rename/delete boards
- Default 3 columns (To Do / In Progress / Done), max 5 columns, column rename/color/delete
- Task CRUD dialog — priority, labels, due date, calendar sync toggle, link-notes flag
- Drag-and-drop within and across columns (`@dnd-kit`)
- Calendar sync — tasks with `syncCalendar` create/update/delete linked `calendar_items` (category `"tasks"`)
- Mobile board drawer; neo-brutalist RetroUI throughout
- **Desktop collapsible “My boards” sidebar** — `PanelLeftClose` in sidebar header; slim `PanelLeft` rail + in-panel reopen button when collapsed; preference in `localStorage` key `kaizenyard-kanban-sidebar-open` via `usePersistedSidebarOpen`

### Anonymous Task Risk Pulse (differentiator)

- Owner starts check-in from task dialog (`task-pulse-panel.tsx`) — one open pulse per task
- Share link `/tasks/pulse/[token]` — Clerk-protected voter page; votes: `on_track` | `at_risk` | `blocked` + optional anonymous note
- HMAC `voterTokenHash(pulseId, clerkId)` — tally visible to owner always; voters see results only after voting or pulse closed
- Risk badge on cards (`kanban-card.tsx`) for owner when open pulse has at-risk/blocked votes
- `getBoardPulseRiskSummaries` returned in `listBoardData` as `pulseRiskByTaskId`

### Board Automations (Butler-style)

- **Triggers (v1, event-driven):** `task_moved_to_column`, `task_created_in_column`, `label_added`, `due_date_passed` (lazy on board fetch), `risk_pulse_flagged` (threshold on at-risk + blocked votes)
- **Actions:** `move_to_column`, `set_priority`, `add_label`, `remove_label`, `offset_due_date`, `toggle_calendar_sync`
- `runAutomationsForTask` in `automation-actions.ts` — cascade guard (depth 1 via `skipAutomation` / `fromAutomation`)
- Automation mutations use `actingAsOwnerId` so voter-triggered rules (e.g. risk pulse) apply as board owner
- UI: ⚡ Automations button in `kanban-page.tsx` → `automation-panel.tsx` + `automation-rule-dialog.tsx`
- `deleteColumn` cleans rules referencing deleted column IDs

### Liveblocks collaboration (Chapter 4.1 / Kanban multiplayer — done)

- **Stack:** `@liveblocks/client`, `@liveblocks/react`, `@liveblocks/node`
- **Env:** `LIVEBLOCKS_SECRET_KEY` (`sk_live_...` / `sk_dev_...`) — server-only; **no public key** (auth-endpoint mode, not `publicApiKey`)
- **Room ID:** `kanban:board:{boardId}` per active board (`lib/kanban/room.ts`)
- **Auth:** `POST /api/liveblocks-auth` — Clerk session + `getBoardRole()` → `READ_ACCESS` (viewer) or `FULL_ACCESS` (owner/editor); protected in `proxy.ts`
- **Postgres = source of truth** for boards/columns/tasks; Liveblocks for presence, comments, and `board-changed` broadcast sync (not Storage)
- **Roles:** `owner` (board `clerkId`), `editor` (mutate), `viewer` (read-only UI + comments read)
- **Invites:** owner invites by email via collaboration panel; pending rows activate on sign-up (`resolvePendingInvites` in `lib/sync-user.ts`)
- **Shared UI:** `components/collaboration/collaboration-panel.tsx` (Kanban wrapper passes board actions)
- **UI:** Collaborate dialog, live avatar stack, per-task comment threads (custom RetroUI, not `@liveblocks/react-ui`), comment count on cards, shared-board icon in sidebar
- **Realtime sync:** `useBoardRealtimeSync` — debounced refetch on remote `board-changed` events after local mutations call `notifyBoardChanged()`
- **Client wiring:** `LiveblocksProvider authEndpoint` on `KanbanPage`; `RoomProvider` + `ClientSideSuspense` per active board
- **Access layer:** `lib/kanban/access.ts` (server DB checks); `lib/kanban/room.ts` (client-safe room IDs + role types — do not import `access.ts` from client components)

### Files

```
lib/kanban/
  actions.ts, types.ts, colors.ts, labels.ts
  access.ts, room.ts, collaboration-actions.ts, use-board-realtime-sync.ts
  pulse-actions.ts, pulse-types.ts
  automation-actions.ts, automation-types.ts, automation-labels.ts

lib/liveblocks/
  config.ts, user-color.ts, comment-utils.ts

app/api/liveblocks-auth/route.ts

components/kanban/
  kanban-page.tsx, kanban-board.tsx, kanban-column.tsx, kanban-card.tsx
  board-sidebar.tsx, board-dialog.tsx, task-dialog.tsx, task-pulse-panel.tsx
  active-collaborators.tsx, collaboration-panel.tsx, task-comments.tsx
  task-thread-counts-context.tsx
  automation-panel.tsx, automation-rule-dialog.tsx
  add-column-popover.tsx, column-options-menu.tsx, color-swatch-picker.tsx

app/(app)/tasks/page.tsx
app/(app)/tasks/pulse/[token]/page.tsx
```

### RetroUI / lint patterns (kanban)

- `Dialog.Header asChild` + `<h2>` — no `Dialog.Title`
- `Popover.Trigger` dot notation — not named `PopoverTrigger`
- Native `<select>` in automation rule dialog (RetroUI Select export pitfalls)
- Form remount via `key` to avoid `set-state-in-effect` ESLint in dialogs
- `Textarea` untyped — use `ChangeEvent<HTMLTextAreaElement>` on `onChange`

## Notes (Chapter 6 + hardening — done)

### Data

- `notes` — per-user note pages (title, color, content jsonb Tiptap JSON, pinned, soft-delete `deletedAt`, sort order)
- `note_collaborators` — email invites per note (editor/viewer roles, pending until invitee signs up)

Migration: `20260701171518_bright_blue_shield`

### Core Notes features

- Two-pane layout: notes sidebar + Tiptap editor (no folders)
- Sidebar: search, new note, pin, color dot, context menu (rename/duplicate/delete), trash section
- Tiptap: slash commands, sticky toolbar, bubble menu, task lists, auto-save, saved status, word count
- AI Refine in bubble menu (grammar, rephrase, shorter/longer, simplify, tone) via `/api/notes/ai-refine` + OpenRouter `@openrouter/sdk` model `qwen/qwen3.5-flash-02-23` (`noteId` required + editor access check); **no OpenAI** — removed `ai` / `@ai-sdk/openai`
- **Multilingual STT:** AssemblyAI streaming via `Speak to Note` — language picker (Auto = `universal-streaming-multilingual` + `languageDetection`; pinned = `u3-rt-pro` + `prompt`); `formatTurns: true`; shared prefs in `speech-languages.ts`
- **Browser TTS (Read aloud):** Web Speech API via `useWebSpeechTts` — read selection (bubble) or full note (header); Chromium + Firefox desktop target; chunking, voice warmup, `wait-for-speech-voices.ts`; viewers get `note-selection-menu.tsx`; editors also get read-aloud in bubble menu; STT start cancels TTS
- Mobile notes drawer; neo-brutalist RetroUI throughout
- **Desktop collapsible notes sidebar** — same pattern as kanban/whiteboard; key `kaizenyard-notes-sidebar-open`
- **Compact editor header** — two-row toolbar: title + actions (collaborators, Read, Share, Pin, menu) on row 1; inline metadata (`Saved · N words · last edited`) + Dictate/language on row 2; uniform `h-8` toolbar buttons (no hover shadow shift)
- Role gating via `getNoteCapabilities()` — viewers read-only + read-aloud; editors dictate + edit; owners manage trash/invites

### Notes STT hardening (AssemblyAI)

- `use-assemblyai-streaming.ts` — `await cleanup()` before each new session; `maxConnectionRetries: 0`; `connectTimeout: 10_000`; `close()` on failed connect; `startingRef` mutex + `isConnecting` state
- User-facing errors for concurrent session limits and connection timeouts (no SDK retry spam)
- `speak-to-note.tsx` — disabled button + Kaizen dots while connecting
- **Tiptap fix:** `StarterKit.configure({ undoRedo: false, link: false, underline: false })` — avoids duplicate `link`/`underline` warnings (standalone extensions still registered)

### Liveblocks Yjs co-editing

- Room ID: `notes:page:{noteId}` per active note
- `@liveblocks/yjs` + Tiptap Collaboration + CollaborationCaret extensions
- Postgres debounced snapshots (~800ms); Y.Doc seeded from DB when room fragment empty after provider sync
- Email sharing like Kanban: collaboration panel, editor/viewer roles, pending invite resolution in `lib/sync-user.ts`
- Trashed notes deny collaborator access (`getNoteRole` checks `deletedAt`)
- Autosave flushes pending title/content on note switch and unmount (no lost titles)

### Structural refactor (maintainability)

- **`lib/collaboration/`** — shared types, email normalize, collaborator display mapper (Kanban + Notes)
- **`components/collaboration/collaboration-panel.tsx`** — single UI; Kanban/Notes panels are thin wrappers
- **`lib/notes/use-notes-list.ts`** — list state, search debounce, CRUD helpers (parent owns orchestration)
- **`lib/notes/mappers.ts`** — `noteRecordToListItem` / `noteRowToListItem` (no duplicated mapping)
- **`lib/notes/permissions.ts`** — `getNoteCapabilities(role)` for UI gating
- **`lib/notes/persistence.ts`** — documents Yjs body vs Postgres title/metadata contract
- **`lib/liveblocks/room-auth.ts`** — room registry for `/api/liveblocks-auth` (kanban + notes + whiteboard handlers)
- **`lib/notes/slash-command-types.ts`** — slash command types in lib (not UI layer)
- Share panel: any collaborator with viewer+ can list members; only owner can invite/remove
- Removed dead Undo/Redo toolbar buttons (StarterKit `undoRedo: false`)
- RetroUI `Menu.tsx` — added `Positioner` wrapper (fixes slash command menu crash)

### Files

```
lib/collaboration/
  types.ts, email.ts, format-collaborator.ts

lib/notes/
  actions.ts, types.ts, room.ts, access.ts, collaboration-actions.ts
  mappers.ts, permissions.ts, persistence.ts, use-notes-list.ts
  ai-refine-prompts.ts, openrouter.ts, speech-languages.ts
  date-utils.ts, slash-command.ts, slash-command-types.ts
  use-note-autosave.ts, use-assemblyai-streaming.ts
  use-web-speech-tts.ts, wait-for-speech-voices.ts

lib/liveblocks/
  room-auth.ts

components/collaboration/
  collaboration-panel.tsx

components/notes/
  notes-page.tsx, notes-sidebar.tsx, note-list-item.tsx, note-editor.tsx
  note-editor-header.tsx, note-toolbar.tsx, note-bubble-menu.tsx
  note-selection-menu.tsx, read-aloud.tsx
  slash-command-list.tsx, speak-to-note.tsx, collaboration-panel.tsx
  trash-panel.tsx, color-swatch-picker.tsx, active-collaborators.tsx

components/whiteboard/     (see Whiteboard section above)

components/loading/
  kaizen-loading.tsx

app/(app)/notes/page.tsx
app/api/assemblyai/token/route.ts
app/api/notes/ai-refine/route.ts
```

### Env (Notes)

- `OPENROUTER_API_KEY` — AI Refine (`/api/notes/ai-refine`, model `qwen/qwen3.5-flash-02-23`); optional `OPENROUTER_HTTP_REFERER`, `OPENROUTER_APP_TITLE`
- `ASSEMBLYAI_API_KEY` — Speak to Note token route (`/api/assemblyai/token`); fetch `llms.txt` before changing AssemblyAI code
- `LIVEBLOCKS_SECRET_KEY` — shared with Kanban (auth-endpoint mode)
- TTS: no env var (browser `speechSynthesis`); Firefox Android unsupported; Linux Firefox may need speech-dispatcher

## Whiteboard (Chapter 7 — done)

### Data

- `whiteboards` — per-user boards (title, color, content jsonb Excalidraw scene, pinned, soft-delete `deletedAt`, sort order)
- `whiteboard_collaborators` — email invites per board (editor/viewer roles, pending until invitee signs up)

Migration: `20260702044645_fine_piledriver`

### Core Whiteboard features

- Two-pane layout: whiteboard sidebar + Excalidraw canvas (neo-brutalist RetroUI chrome)
- **Maximized canvas** — page uses negative margins (`-m-4 sm:-m-6 lg:-m-8`) + `h-full min-h-0 overflow-hidden` so Excalidraw fills dashboard main
- Sidebar: search, filter (all/mine/shared), new board, pin, color dot, context menu (rename/duplicate/delete)
- **Desktop collapsible sidebar** — `PanelLeftClose` in “Your Whiteboards” header; slim reopen rail + floating `PanelLeft` in canvas header when collapsed; key `kaizenyard-whiteboard-sidebar-open` via `lib/whiteboard/use-desktop-sidebar-open.ts` (wraps shared hook)
- Excalidraw: shapes, draw, text, eraser, image upload; **sticky-note toolbar button** (`lib/whiteboard/sticky-note.ts` — `convertToExcalidrawElements`, viewport-center placement)
- **Compact header** — breadcrumb + title + star + actions in toolbar row; `TOOLBAR_BTN` class for aligned `h-8` controls
- **Canvas footer** — Preview (zen mode) + Fullscreen (`use-fullscreen.ts`, `zenModeEnabled` on Excalidraw)
- AI Diagram dialog — flowchart, mind map, system architecture, user journey, process via `/api/whiteboard/ai-generate` + OpenRouter `qwen/qwen3.5-flash-02-23`
- PNG export via dynamic `exportToBlob`
- Mobile sidebar drawer; role gating via `getWhiteboardCapabilities()` — viewers read-only + export
- **Liveblocks badge hidden** — `#liveblocks-badge { display: none }` in `whiteboard-excalidraw.css`
- **Client-only load** — `whiteboard-page-loader.tsx` dynamic import `ssr: false`

### Excalidraw mount safety

- `lib/whiteboard/excalidraw-mount.ts` — `whenExcalidrawReady()` / `safeUpdateScene()` gate `updateScene` until `getAppState().isLoading === false` (fixes “setState on unmounted _App”)
- `lib/whiteboard/scene.ts` — sanitizes `appState` before persist/restore (e.g. `collaborators` must be object, not array)

### Liveblocks Yjs co-editing

- Room ID: `whiteboard:page:{whiteboardId}` per active board
- `@liveblocks/yjs` + `use-excalidraw-yjs` (Y.Map scene keys: elements, appState, files)
- Postgres debounced snapshots (~800ms); Yjs seeded from DB when room empty after provider sync
- Email sharing like Notes/Kanban: collaboration panel, editor/viewer roles, pending invite resolution in `lib/sync-user.ts` (`resolvePendingWhiteboardInvites`)
- Pointer presence mapped to Excalidraw collaborators map
- `lib/liveblocks/room-auth.ts` — whiteboard handler registered alongside kanban + notes

### Files

```
lib/whiteboard/
  actions.ts, types.ts, room.ts, access.ts, collaboration-actions.ts
  mappers.ts, permissions.ts, persistence.ts, scene.ts, excalidraw-mount.ts
  use-whiteboard-list.ts, use-whiteboard-autosave.ts, use-excalidraw-yjs.ts
  use-desktop-sidebar-open.ts, use-fullscreen.ts
  ai-diagram-prompts.ts, sticky-note.ts

components/whiteboard/
  whiteboard-page-loader.tsx, whiteboard-page.tsx, whiteboard-sidebar.tsx
  whiteboard-list-item.tsx, whiteboard-header.tsx, whiteboard-canvas.tsx
  whiteboard-canvas-footer.tsx, whiteboard-excalidraw.css
  excalidraw-client.tsx, ai-diagram-dialog.tsx, collaboration-panel.tsx

app/(app)/whiteboard/page.tsx
app/api/whiteboard/ai-generate/route.ts
```

## Shared UX patterns (2026-07-02)

### Kaizen loading (three yellow dots)

- **`components/loading/kaizen-loading.tsx`** — `KaizenLoadingDots`, `KaizenLoadingScreen`, `KaizenLoadingInline`
- Neo-brutalist yellow squares (`bg-primary`, `border-2`) with staggered wave animation (`kaizen-dot-wave` in `globals.css`)
- Used across: notes/kanban/whiteboard/calendar page loads, Liveblocks `ClientSideSuspense` fallbacks, collaboration panel, trash, automations, pulse vote pages, STT connecting, AI diagram generate, AI refine bubble

### Persisted feature sidebars

- **`lib/use-persisted-sidebar-open.ts`** — generic `localStorage` open/close for feature sidebars (not dashboard app sidebar)
- Keys: `kaizenyard-notes-sidebar-open`, `kaizenyard-kanban-sidebar-open`, `kaizenyard-whiteboard-sidebar-open`
- Collapsed rail buttons use `shadow-none` (matches `sidebar-rail.ts` — no clip/overflow)

### Active collaborators compact mode

- `components/kanban/active-collaborators.tsx` — optional `compact` prop (`size-7` avatars, tighter Live badge); used in notes header

## Dark mode (full-site — done)

- **`next-themes`** — `ThemeProvider` with `attribute="class"`, `storageKey="kaizenyard-theme"`, `defaultTheme="system"`, `disableTransitionOnChange` (no page-wide color lag)
- **`components/theme/theme-toggle.tsx`** — neo-brutalist sun/moon button; icon-only animation
- **Real `.dark` tokens** in `globals.css` — near-black surfaces, light text, light borders, yellow primary preserved
- **Token migration** — app-wide `border-black` → `border-border` so shadows/borders adapt
- **Calendar categories** — `dark:` variants on chip colors in `lib/calendar/categories.ts`
- **Clerk** — `ClerkProviderThemed` uses `shadcn` theme (reads CSS vars); `ThemedToaster` syncs Sonner theme
- **Placement** — landing navbar, auth layouts, dashboard mobile bar + fixed desktop toggle

## Database

- **Driver:** `pg` + `drizzle-orm/node-postgres` via `db/pool.ts` (IPv4 + TLS SNI for Neon — fixes Node IPv6 `ETIMEDOUT` on some networks)
- **Migrations:** `npm run db:migrate` uses `scripts/db-migrate.ts` (TCP), not `drizzle-kit migrate` (WebSocket)
- **Health check:** `npm run db:check` via `scripts/db-check.ts`
- **User sync:** select-by-clerkId → select-by-email → insert; `withDbRetry` for transient failures; `lib/format-db-error.ts`

## Files to know

```
components/landing/
  landing-page.tsx      composer
  landing-navbar.tsx    fixed nav + mobile menu + theme toggle
  hero-section.tsx      video hero
  features-section.tsx
  attestation-section.tsx
  roadmap-section.tsx
  privacy-section.tsx   + LandingFooter
  privacy-cta.tsx

components/dashboard/
  dashboard-shell.tsx     layout + mobile drawer + top bar + theme toggle
  app-sidebar.tsx         desktop sidebar panel
  sidebar-nav.tsx         grouped links + active state
  sidebar-search.tsx      command palette
  sidebar-profile.tsx     Clerk auth footer
  sidebar-header.tsx      logo + hamburger collapse toggle
  sidebar-context.tsx     collapse + mobile drawer state
  sidebar-rail.ts         collapsed rail layout tokens
  neo-hamburger-button.tsx shared neo-brutalist menu button
  clerk-appearance.ts     Clerk component appearance overrides
  settings-profile.tsx    Settings page UserProfile
  nav-config.ts           nav items + groups
  skeleton-page.tsx       placeholder page template

components/theme/
  theme-provider.tsx      next-themes wrapper
  theme-toggle.tsx          sun/moon toggle
  themed-toaster.tsx        Sonner theme sync

components/clerk-provider-themed.tsx  Clerk + shadcn appearance

components/loading/
  kaizen-loading.tsx      three-dot yellow loader (screen / inline / dots only)

components/brand/
  logo.tsx

db/
  pool.ts                 Neon-friendly pg Pool (IPv4 + SNI)
  index.ts                drizzle node-postgres

lib/
  mask-email.ts           partial email masking for sidebar
  collaboration/          shared invite types, email normalize, collaborator display mapper
  calendar/               categories, date-utils, server actions, types, pulse-actions
  kanban/                 boards/columns/tasks, pulse, automations, collaboration, Liveblocks sync
  notes/                  CRUD, Yjs co-edit, OpenRouter AI refine, multilingual STT, browser TTS
  whiteboard/             Excalidraw, Yjs sync, AI diagrams, sticky notes, mount safety
  liveblocks/             types, user colors, comment body helpers, room-auth registry
  use-persisted-sidebar-open.ts  localStorage sidebar open state (notes/kanban/whiteboard)
  sync-user.ts            Clerk → users upsert + pending board/note/whiteboard/space invite resolution
  pages/                  spaces, pages, files, vault session, Stellar contract helpers
  templates/              AI template builder CRUD, runtime state, sidebar pins, OpenRouter prompt
  stellar/                Stellar SDK config + Soroban invoke helpers
  vault/                  ZK commitment, snarkjs prover, unlock session
  format-db-error.ts      readable DB errors
  with-db-retry.ts        transient connection retry
  use-is-client.ts        hydration-safe client flag
  use-now-ms.ts           week view now-line clock

scripts/
  db-check.ts             connection + schema sanity
  db-migrate.ts           TCP drizzle migrator
```

## Design decisions (user preferences)

- Hero: **minimal text**, video must stay **clearly visible** (light bottom gradient only, no heavy blur on video)
- Navbar on hero: **fully transparent** (no white/yellow bar)
- Below fold: **keep full marketing sections** — don't strip when simplifying hero
- Auth: **dedicated routes**, not popups
- Sidebar: **do not show full user email** — use `maskEmail()` in compact UI
- Neo-brutalism everywhere — use semantic tokens (`border-border`, `bg-background`) not hardcoded `border-black`
- Dark mode: top-right toggle, instant CSS-var switch, no full-page transition lag
- Feature sidebars (notes/kanban/whiteboard): collapsible on desktop to maximize editor/canvas area; preference persisted per feature

## Pages & Spaces (Chapter 8 + ZK Secure Vaults + folder UX — done)

### Data

- `spaces` — name, description, color, `isVault`, `vaultCommitment`, `vaultSalt`, favorites, archive, soft-delete
- `pages` — per-space Tiptap pages with templates, favorites, `lastEditedByClerkId`, author initials in lists
- `space_collaborators` — email invites per space (editor/viewer); vault spaces not shareable in v1
- `space_files` — file attachments per space (name, mimeType, sizeBytes, dataBase64, 5 MB upload limit v1)

Migrations: `20260702072004_sturdy_randall_flagg` (spaces/pages), `20260702074035_unique_maestro` (space_files)

### Folder UX (neo-brutalism + RetroUI)

- **All Spaces** (`/pages`) — “Organize every working document by space.”, filter tabs, search, grid/list, New Space + New Page, space cards with folder icon, owner avatar initials, page/file counts, star + ⋯ menu
- **Space detail** — ← All Spaces breadcrumb, folder header, unified **pages + files** table (Page Name + By XX, Type, Updated, star + ⋯)
- **Context menus** — Rename, Move (space picker), Duplicate, Favorite, Share (copy link), Export (JSON), Archive, Delete; files also Upload/Download
- **Page editor** — Tiptap + Liveblocks Yjs, templates, autosave, STT/TTS from Notes stack

### Secure Vaults (Web3)

- ZK-gated spaces; locked UI (`••••••` titles); Freighter + Soroban unlock
- Client: `lib/vault/` (commitment, prover, session), `lib/stellar/` (SDK contract calls)

### Files

```
lib/pages/
  actions.ts, file-actions.ts, access.ts, types.ts, room.ts, mappers.ts
  permissions.ts, templates.ts, collaboration-actions.ts
  use-spaces-list.ts, use-page-autosave.ts, persistence.ts
  download.ts, initials.ts, user-display.ts

lib/stellar/config.ts, contract.ts
lib/vault/commitment.ts, prover.ts, session.ts
hooks/use-freighter.ts

components/pages/
  all-spaces-view.tsx, space-detail-view.tsx, page-editor-view.tsx
  space-card.tsx, space-actions-menu.tsx, page-actions-menu.tsx
  pages-section-header.tsx, new-page-dialog.tsx, rename-item-dialog.tsx
  upload-file-button.tsx, space-dialog.tsx, vault-unlock-dialog.tsx
  page-editor.tsx, page-editor-header.tsx, collaboration-panel.tsx

contracts/vault_verifier/
circuits/vault_unlock/
scripts/build-vault-zk.sh
.agents/skills/          Stellar/Web3 + Drizzle agent skills

app/(app)/pages/...
```

## AI Template Builder (Chapter 9 — v2 done)

### Data

- `generated_apps` — per-user AI mini apps: `definition` jsonb, `runtimeState` jsonb, `sidebarPinned`, `sidebarOrder` (max 3 pins), public share fields, and ZK share commitment metadata
- `generated_app_collaborators` — email collaborators for generated apps (`editor` | `viewer`) with pending invite resolution on sign-in

Migrations: `20260702080737_ambiguous_hobgoblin`, `20260702095220_chilly_carnage`

### Features

- **`/templates`** — prompt (500 chars), suggestion chips, Vercel AI SDK structured generation, inline preview, Created Apps cards, sharing controls
- **`/templates/app/[appId]`** — dynamic renderer with persisted runtime (checklists, forms, progress) and share dialog
- **`/templates/share/[token]`** — public shared app route with optional ZK passphrase gate
- **Sidebar pins** — up to 3 apps under **AI Generated Apps** group + ⌘K search
- **Blocks:** stats, list, table, form, progress, checklist, tags, chart placeholder, text with responsive section layouts and runtime-backed action buttons
- **Sharing:** public link mode, collaborator invites, copy-link UX, middleware exception for share route
- **ZK share:** `circuits/app_share/app_share.circom`, `contracts/app_share_verifier/`, `lib/templates/zk-share/*`, Freighter-backed share commitment registration and protected unlock flow

### Compact build summary

- Implemented Template Builder v2 in-app: RetroUI layout polish, structured AI generation, public sharing, collaborator sharing, and Stellar/ZK share scaffolding.
- Switched template generation to Vercel AI SDK with OpenRouter provider and schema-validated object output.
- Added generated app share schema (`shareToken`, `shareEnabled`, `shareMode`, ZK metadata) plus `generated_app_collaborators`.
- Added public route `app/templates/share/[token]/page.tsx`, share dialog UX, and middleware exception for public links.
- Added initial Stellar app-share pieces: `circuits/app_share/app_share.circom`, `contracts/app_share_verifier/`, `lib/templates/zk-share/*`.
- Verified local app changes with `npm run build`, lint on touched files, `npm run db:generate`, and `npm run db:migrate`.

### Web3 deployment status

- No Stellar deployment commands have been run yet for the new app-share flow.
- `contracts/app_share_verifier/` is present locally only.
- `NEXT_PUBLIC_APP_SHARE_VERIFIER_CONTRACT_ID` is not ready until we deploy later.
- ZK share is scaffolded in code, but production-like end-to-end testing still depends on contract deployment plus `public/zk/app-share/` artifacts.

### Deploy later: Stellar commands

Current app config uses public Stellar testnet infrastructure and Freighter. There is **no Stellar API key required** for the default public testnet RPC/Horizon/Friendbot endpoints already referenced by the app. If we later switch to a paid RPC provider, get that provider-specific key from that provider's dashboard and replace the RPC URL env var; Stellar itself does not issue a universal API key for testnet access.

Suggested later flow:

```bash
# 1) Install the Stellar CLI if missing
brew install stellar-cli
# or see: https://developers.stellar.org/docs/tools/cli

# 2) Build the contract
cd contracts/app_share_verifier
cargo build --target wasm32v1-none --release

# 3) Add an identity for testnet
stellar keys generate kaizenyard-app-share --network testnet

# 4) Fund the identity on testnet
stellar keys fund kaizenyard-app-share --network testnet

# 5) Deploy the contract
stellar contract deploy \
  --wasm target/wasm32v1-none/release/app_share_verifier.wasm \
  --source kaizenyard-app-share \
  --network testnet

# 6) Save returned contract id into env
NEXT_PUBLIC_APP_SHARE_VERIFIER_CONTRACT_ID=<returned_contract_id>
```

Optional local invocation checks after deploy:

```bash
stellar contract invoke \
  --id "$NEXT_PUBLIC_APP_SHARE_VERIFIER_CONTRACT_ID" \
  --source kaizenyard-app-share \
  --network testnet \
  -- register_share_app \
  --owner <G...PUBLIC_KEY> \
  --app_id 1 \
  --commitment <hex_32_bytes>
```

### ZK artifact reminder

Before full ZK share testing later:

```bash
# add or run an app-share build script later
circom circuits/app_share/app_share.circom --r1cs --wasm --sym -o public/zk/app-share -p bls12381
```

### Files

```
lib/templates/actions.ts, types.ts, schema.ts, ai-prompt.ts, mappers.ts
lib/templates/access.ts, collaboration-actions.ts, zk-share/*
lib/templates/use-generated-apps.ts, use-pinned-sidebar-apps.ts, use-app-runtime.ts
components/templates/template-builder-view.tsx, generated-app-view.tsx, shared-app-view.tsx, share-app-dialog.tsx, dynamic-app-renderer.tsx
app/api/templates/ai-generate/route.ts
app/(app)/templates/..., app/templates/share/[token]/page.tsx
```

app/(app)/templates/..., app/templates/share/[token]/page.tsx
```

## Settings (Chapter 10 — done)

### Data

- `user_settings` — preferences, AI model/behavior/tone, feature toggles, notifications jsonb, accent color
- `user_categories` — per-user categories for `calendar`, `kanban`, `notes`, `reminder` (key, name, color, icon, sort order)
- `notes.category_key` — optional note category slug

Migration: `20260702101606_burly_medusa`

### Features

- **`/settings`** — left-nav settings shell (desktop) + mobile drawer; redirects to `/settings/profile`
- **Profile** — Clerk avatar/name/email summary, timezone, language; nav links use `Link` + `buttonVariants()` (not `Button render={<Link />}` — Base UI `nativeButton` warning)
- **`/settings/account`** — Clerk `UserProfile` (`path="/settings/account"`); replaces old catch-all `/settings/[[...rest]]`
- **Preferences** — theme (next-themes), accent presets (`data-accent` in `globals.css` + `AccentColorApplier` in app layout), calendar/task defaults, auto-save, compact mode
- **Categories** — CRUD + DnD reorder per module; seeded from legacy hardcoded lists; wired into calendar/reminder pickers, kanban labels, notes sidebar category menu
- **AI Settings** — model select, behavior/tone, per-feature toggles; `lib/settings/ai-config.ts` gates `/api/notes/ai-refine`, `/api/whiteboard/ai-generate`, `/api/templates/ai-generate` + client disables (notes bubble, template builder, whiteboard diagram)
- **Notifications** — email/reminder/comment/marketing/system/push toggles + due-date alert offset
- **`/settings/calendar`** — focus goal, work hours, no-meeting days; calendar toolbar popover links to full page
- **Data export** — `GET /api/settings/export` JSON backup (Clerk-protected in `proxy.ts`)
- **Privacy** — AI data usage toggle + links to account security
- **Integrations / About** — stub cards + version/help links
- **Subscription** — skipped in v1 (no Clerk Billing section)

### Removed / replaced

- Deleted `components/dashboard/settings-profile.tsx` and `app/(app)/settings/[[...rest]]/page.tsx`

### Key files

```
lib/settings/actions.ts, categories-actions.ts, category-resolver.ts, ai-config.ts, export.ts
lib/settings/use-user-settings.ts, use-user-categories.ts, use-ai-features.ts, nav-config.ts
components/settings/settings-shell.tsx, accent-color-applier.tsx, *-section.tsx
app/(app)/settings/..., app/api/settings/export/route.ts
```

## Not done yet

- Feature internals (**assistant** route — still skeleton)
- Real global search (dashboard command palette is nav-only)
- Attestation feature implementation (beyond anonymous pulse voting pattern)
- Clerk Organizations / workspace switcher (when enabled in Clerk dashboard)
- Kanban `collaboration-actions.ts` refactor to use `lib/collaboration/` helpers (Notes + shared panel done; Kanban actions still separate)
- Liveblocks on calendar + AI assistant (room ID pattern documented in AGENTS.md; kanban/notes/whiteboard/pages done)
- Landing roadmap grid accuracy — update chapters 3/5/6/7/8 status to match shipped features
- **Web3 hardening:** deploy `vault_verifier` testnet, commit/build `public/zk/` artifacts, embed full Groth16 pairing verify in contract
- **File storage v2:** blob store (S3/R2) for files >5 MB instead of Postgres base64
