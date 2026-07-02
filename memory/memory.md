# Kaizenyard — session memory

Last updated: 2026-07-02

## Product direction

- **Kaizenyard** = privacy-first productivity app
- Flagship feature: **anonymous attestation** — feedback provably from a verified group member, without revealing identity
- Planned roadmap chapters: setup → auth → dashboard → calendar → kanban → notes → whiteboard → spaces → attestation → AI assistant

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
- Skeleton pages only — RetroUI `Card` + “Coming soon” placeholder per route (except **Calendar**, **Tasks/Kanban**, and **Notes** — full features)
- **Settings** — full Clerk `UserProfile` at `/settings` (catch-all `[[...rest]]`)
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
- Role gating via `getNoteCapabilities()` — viewers read-only + read-aloud; editors dictate + edit; owners manage trash/invites

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
- **`lib/liveblocks/room-auth.ts`** — room registry for `/api/liveblocks-auth` (kanban + notes handlers)
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

app/(app)/notes/page.tsx
app/api/assemblyai/token/route.ts
app/api/notes/ai-refine/route.ts
```

### Env (Notes)

- `OPENROUTER_API_KEY` — AI Refine (`/api/notes/ai-refine`, model `qwen/qwen3.5-flash-02-23`); optional `OPENROUTER_HTTP_REFERER`, `OPENROUTER_APP_TITLE`
- `ASSEMBLYAI_API_KEY` — Speak to Note token route (`/api/assemblyai/token`); fetch `llms.txt` before changing AssemblyAI code
- `LIVEBLOCKS_SECRET_KEY` — shared with Kanban (auth-endpoint mode)
- TTS: no env var (browser `speechSynthesis`); Firefox Android unsupported; Linux Firefox may need speech-dispatcher

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
  liveblocks/             types, user colors, comment body helpers, room-auth registry
  sync-user.ts            Clerk → users upsert + pending board/note invite resolution
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

## Not done yet

- Feature internals (whiteboard, pages, templates, assistant)
- Real global search
- Attestation feature implementation (beyond anonymous pulse voting pattern)
- Clerk Organizations / workspace switcher (when enabled in Clerk dashboard)
- Kanban `collaboration-actions.ts` refactor to use `lib/collaboration/` helpers (Notes done; Kanban panel UI shared)
- Liveblocks reuse on other features (calendar, whiteboard, AI assistant rooms — room ID pattern in AGENTS.md)
