# AGENTS.md — Kaizenyard

Read this before changing code.

## Product

Privacy-first productivity app. Core differentiator: **anonymous attestation** — verified customers or employees can leave feedback provably from a real group member, without identifying who.

Early stage: auth + marketing landing + dashboard shell + DB user sync. Calendar v2 (Chapter 4+), Kanban (Chapter 5), Notes (Chapter 6), and Whiteboard (Chapter 7) implemented; other feature routes are skeletons.

## Project

Next.js 16 App Router. Stack: React 19, TypeScript, Clerk auth, Neon Postgres + Drizzle ORM v1 RC, Tailwind v4, RetroUI components. Single app at repo root — not a monorepo.

## Layout

```
app/
  page.tsx                    landing (marketing home)
  layout.tsx                  ClerkProvider, UserSync, metadata
  globals.css                 theme + hero animation keyframes
  sign-in/                    Clerk sign-in + back-link layout
  sign-up/                    Clerk sign-up + back-link layout
  (app)/                      protected dashboard shell
    layout.tsx                DashboardShell
    dashboard/page.tsx
    assistant/page.tsx
    calendar/page.tsx         full calendar (month/week, DnD, drafts)
    tasks/page.tsx             full kanban (boards, columns, DnD, calendar sync, Liveblocks collaboration)
    notes/page.tsx             full notes (Tiptap editor, STT, TTS, AI refine, Liveblocks Yjs sharing)
    whiteboard/page.tsx         full whiteboard (Excalidraw, AI diagrams, PNG export, Liveblocks Yjs sharing)
    pages/page.tsx
    templates/page.tsx
    settings/[[...rest]]/page.tsx   Clerk UserProfile
components/
  landing/                    marketing page sections
  dashboard/                  app shell + sidebar
  calendar/                   month/week views, draft panel, DnD, event dialog
  kanban/                     boards sidebar, columns, cards, task dialog, DnD, collaboration, comments
  notes/                      sidebar, Tiptap editor, slash commands, STT, TTS, AI refine, collaboration panel
  whiteboard/                 sidebar, Excalidraw canvas, AI diagrams, sticky notes, collaboration panel
  brand/logo.tsx              shared SVG logo
  auth-header.tsx             legacy header (unused; keep for future)
  user-sync.tsx               client: sync Clerk user → DB on visit
  retroui/                    UI kit — not components/ui/
db/                           index.ts, schema.ts
lib/                          utils.ts (cn), sync-user.ts, mask-email.ts, calendar/, kanban/, notes/, whiteboard/, liveblocks/
app/api/liveblocks-auth/      Liveblocks room auth (Clerk + board/note/whiteboard role)
app/api/assemblyai/token/     AssemblyAI temporary streaming token
app/api/notes/ai-refine/      OpenRouter text refinement for selected note text (qwen/qwen3.5-flash-02-23)
app/api/whiteboard/ai-generate/ OpenRouter diagram generation for whiteboard (qwen/qwen3.5-flash-02-23)
proxy.ts                      Clerk middleware — use this, NOT middleware.ts
migrations/                   Drizzle SQL migrations
memory/                       session notes for agents (memory.md)
```

`@/*` → repo root. No `src/`, `actions/`, `hooks/`, or tests yet.

## Landing page (`/`)

Composed in `components/landing/landing-page.tsx`:

| File | Role |
|------|------|
| `landing-navbar.tsx` | Fixed transparent nav on hero; white text over video; RetroUI buttons; scroll → solid bar |
| `hero-section.tsx` | Full-screen video hero, minimal copy, stats row |
| `features-section.tsx` | 6 feature cards |
| `attestation-section.tsx` | Flagship attestation explainer + 3 steps |
| `roadmap-section.tsx` | 10-chapter dev roadmap grid |
| `privacy-section.tsx` | Privacy pillars + CTA + footer |
| `privacy-cta.tsx` | Sign-up button for privacy section |

**Auth on landing:** `SignInButton` / `SignUpButton` with `mode="redirect"` → `/sign-in` and `/sign-up`. `forceRedirectUrl="/dashboard"` after auth. **Do not** use modal/popup auth unless explicitly requested.

## Dashboard (`app/(app)/`)

- Wrapped in `DashboardShell` — sidebar + main content
- All routes protected in `proxy.ts` via `auth.protect()`
- Pages are **skeletons only** unless user asks for feature internals (calendar, tasks/kanban, and notes are implemented)
- Settings uses Clerk `<UserProfile routing="path" path="/settings" />` in `settings-profile.tsx`
- **Do not** add `<OrganizationSwitcher />` until Clerk Organizations is enabled in the Clerk dashboard

## Neo-brutalism design system (required)

Kaizenyard uses a consistent **neo-brutalist** look. Follow these rules for all new UI (landing, dashboard, features).

### Core tokens (from `app/globals.css`)

| Token | Usage |
|-------|--------|
| `border-2 border-border` | Default border on cards, inputs, sidebar, buttons (adapts in dark mode) |
| `shadow-md` / `shadow-sm` | Hard offset shadows (not soft blur) — see `--shadow-*` in globals |
| `bg-primary` | Yellow accent (`hsl(50 100% 60%)`) — CTAs, active nav |
| `bg-background` | White surfaces |
| `text-foreground` | Black text |
| `font-head` | Archivo Black — headings, labels, button text |
| `font-sans` | Space Grotesk — body, nav items, descriptions |

### Patterns

- **Cards / panels:** `border-2 border-border rounded shadow-md` — optional `hover:-translate-y-0.5 hover:shadow-lg` on marketing cards
- **Active nav item:** `bg-primary border-border text-primary-foreground shadow-sm`
- **Buttons:** Use RetroUI `Button` with `variant="default"` (yellow), `outline`, or `secondary` — they include border + hard shadow + press translate
- **Icon-only controls (sidebar rail):** Use `NeoHamburgerButton` or `sidebar-rail.ts` tokens — **no hard shadows** on collapsed rail (prevents overflow/clipping)
- **Section labels:** `font-head text-[10px] uppercase tracking-[0.2em] text-muted-foreground`
- **Colorful icons:** Lucide icons with per-item `text-*-600` classes in `nav-config.ts` — not on active (yellow) state
- **Spacing:** Compact nav (`text-sm py-1.5`), generous page padding (`p-4 sm:p-6 lg:p-8`)

### Do

- Use `components/retroui/*` for buttons, cards, inputs, dialogs, drawers, command palette, tooltips
- Use `cn()` from `@/lib/utils` for conditional classes
- Match existing landing + dashboard patterns before inventing new ones
- Mask emails in compact UI via `maskEmail()` from `@/lib/mask-email`
- Style Clerk embeds via `clerk-appearance.ts` (`border-2 border-border`, hard shadows)
- **Dark mode:** `next-themes` + `ThemeToggle` (top-right); use semantic tokens (`bg-background`, `border-border`) — not hardcoded `border-black`

### Don't

- Use `components/ui/` (shadcn default) — use `retroui/`
- Use soft rounded pill buttons, glassmorphism, or heavy blur over hero video
- Use `OrganizationSwitcher` without Clerk Orgs enabled
- Show full user email in sidebar — mask it
- Add hard `shadow-md` to collapsed sidebar icon buttons (use `sidebar-rail.ts` / `shadow-none`)

## RetroUI components

Install: `npx shadcn@latest add @retroui/<name>` → `components/retroui/`

Already in repo: `Button`, `Card`, `Text`, `Input`, `Dialog`, `Drawer`, `Command`, `Tooltip`, `Avatar`, `Popover`, `Select`, and more.

**Usage rules:**

- Import from `@/components/retroui/<Name>` (e.g. `import { Button } from "@/components/retroui/Button"`)
- RetroUI `Drawer`: `Content` must render inside `Viewport` (already fixed in `Drawer.tsx`)
- RetroUI `Tooltip`: `Content` must render inside `Positioner` (already fixed in `Tooltip.tsx`)
- `retroui/*` has pre-existing lint/build issues — only fix files you touch

## Commands

```bash
npm run dev | build | lint
npm run db:generate | db:migrate | db:check   # schema changes: edit schema → generate → migrate
```

## Env (copy `.env.example` → `.env`, never commit)

`DATABASE_URL`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in`, `NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up`, `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard`, `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard`, `LIVEBLOCKS_SECRET_KEY` (server-only `sk_` key for `/api/liveblocks-auth` — no public Liveblocks key needed), `ASSEMBLYAI_API_KEY` (server-only for `/api/assemblyai/token`), `OPENROUTER_API_KEY` (server-only for `/api/notes/ai-refine` and `/api/whiteboard/ai-generate` via OpenRouter; model `qwen/qwen3.5-flash-02-23`). Optional: `OPENROUTER_HTTP_REFERER`, `OPENROUTER_APP_TITLE` for OpenRouter rankings metadata. Do not read or print `.env`.

## Clerk

- `proxy.ts`: `clerkMiddleware()` + `createRouteMatcher` for app routes **and** `/api/liveblocks-auth(.*)`, `/api/assemblyai/token(.*)`, `/api/notes/ai-refine(.*)`, `/api/whiteboard/ai-generate(.*)`; `await auth.protect()` on match
- `ClerkProvider` inside `<body>` in `app/layout.tsx`, `appearance={{ theme: shadcn }}`
- `await auth()` from `@clerk/nextjs/server` — always async
- Use `@clerk/nextjs`, not `@clerk/clerk-react`
- Routes are public by default until `auth.protect()` is added
- **User sync:** `components/user-sync.tsx` + `lib/sync-user.ts` upsert signed-in users to `users` by `clerkId` (no webhooks)
- Dedicated auth pages: `app/sign-in/[[...sign-in]]/page.tsx`, `app/sign-up/[[...sign-up]]/page.tsx` with minimal `layout.tsx` back-link to `/`
- Settings: `UserProfile` with `routing="path"` + catch-all `settings/[[...rest]]`

## Database

```ts
import { db, users } from "@/db";
await db.select().from(users);
```

- Drizzle **v1 RC** (`drizzle-orm@1.0.0-rc.4`) — see `.agents/skills/drizzle-best-practices/SKILL.md`
- Import tables from `@/db`; don't pass `schema` into `drizzle()`
- Postgres via `pg` + `drizzle-orm/node-postgres` (`db/pool.ts` resolves Neon over IPv4 + SNI)
- `users` table: `clerkId` (unique), `email`, `name`, timestamps
- `calendar_items` table: `clerkId`, `title`, `itemType`, `category`, `description`, `location`, `scheduledAt`, `durationMin`, `recurrenceRule`, `bufferBeforeMin`, `bufferAfterMin`, `isPrivate`, `attendeeCount`, timestamps — scoped per user via server actions in `lib/calendar/actions.ts`
- Related tables: `calendar_item_exceptions`, `calendar_settings`, `calendar_meeting_pulses`, `calendar_pulse_votes`
- `kanban_boards`, `kanban_columns`, `kanban_tasks` — boards with columns, tasks, optional `calendarItemId` sync; server actions in `lib/kanban/actions.ts`
- `kanban_board_collaborators` — email invites per board (`editor` | `viewer`); pending until invitee signs up; access in `lib/kanban/access.ts`, invites in `lib/kanban/collaboration-actions.ts`
- Related kanban tables: `kanban_task_pulses`, `kanban_task_pulse_votes`, `kanban_automations`
- `notes` — per-user note pages (`title`, `color`, `content` jsonb Tiptap JSON, `pinned`, soft-delete `deletedAt`); server actions in `lib/notes/actions.ts`
- `note_collaborators` — email invites per note (`editor` | `viewer`); pending until invitee signs up; access in `lib/notes/access.ts`, invites in `lib/notes/collaboration-actions.ts`
- `whiteboards` — per-user whiteboard pages (`title`, `color`, `content` jsonb Excalidraw scene, `pinned`, soft-delete `deletedAt`); server actions in `lib/whiteboard/actions.ts`
- `whiteboard_collaborators` — email invites per whiteboard (`editor` | `viewer`); pending until invitee signs up; access in `lib/whiteboard/access.ts`, invites in `lib/whiteboard/collaboration-actions.ts`

## Liveblocks (Kanban + Notes + Whiteboard collaboration)

- Packages: `@liveblocks/client`, `@liveblocks/react`, `@liveblocks/node`, `@liveblocks/yjs`, `yjs` (same Liveblocks version)
- **Auth-endpoint mode** — client uses `LiveblocksProvider authEndpoint="/api/liveblocks-auth"`, not `publicApiKey`
- Kanban room per board: `kanban:board:{boardId}` (`lib/kanban/room.ts` — safe for client imports)
- Notes room per page: `notes:page:{noteId}` (`lib/notes/room.ts` — safe for client imports)
- Whiteboard room per page: `whiteboard:page:{whiteboardId}` (`lib/whiteboard/room.ts` — safe for client imports)
- Server access checks: `lib/kanban/access.ts`, `lib/notes/access.ts`, `lib/whiteboard/access.ts` — **never import from client components** (pulls in `db`)
- Types: `lib/liveblocks/config.ts` — `Presence` (optional `cursor`), `UserMeta`, `ThreadMetadata: { taskId }`, `RoomEvent: board-changed | note-changed | whiteboard-changed`
- Kanban: Postgres source of truth; Liveblocks for presence, task comment threads, board-change broadcast sync
- Notes: Postgres stores metadata + debounced Tiptap JSON snapshots; Liveblocks Yjs for real-time co-editing + presence
- Whiteboard: Postgres stores metadata + debounced Excalidraw scene snapshots; Liveblocks Yjs for real-time co-editing + pointer presence
- Reuse room ID pattern later: `calendar:user:{userId}`, `ai:chat:{sessionId}`, etc.

## Notes speech (STT + TTS)

- **AssemblyAI STT:** realtime dictation via `Speak to Note` — `useAssemblyAIStreaming` + `/api/assemblyai/token`. Language picker: Auto (`universal-streaming-multilingual` + `languageDetection`) or pinned (`u3-rt-pro` + `prompt`). Always fetch `https://www.assemblyai.com/docs/llms.txt` before changing AssemblyAI code.
- **Browser TTS:** read selection or full note via Web Speech API (`useWebSpeechTts`, `read-aloud.tsx`) — no env var; targets **desktop Chromium + Firefox**. Shared language prefs in `lib/notes/speech-languages.ts` (`kaizenyard-notes-speech-prefs`). Cross-browser helpers: `wait-for-speech-voices.ts` (voiceschanged + timeout), chunked utterances, warmup, `onerror` mapping.
- **Access:** editors dictate + read; viewers read-only (selection bubble via `note-selection-menu.tsx`). STT start cancels active TTS.
- **Known limits:** Firefox Android unsupported; Linux Firefox may need speech-dispatcher; empty voices under Firefox RFP — show actionable errors, not silent fail.

## Whiteboard (Chapter 7 — done)

- **Engine:** `@excalidraw/excalidraw` (client-only via `whiteboard-page-loader.tsx` `ssr: false`)
- **Layout:** two-pane — whiteboard sidebar + Excalidraw canvas with RetroUI neo-brutalist chrome
- **Persistence:** Postgres `whiteboards.content` jsonb (`elements`, `appState`, `files`); Liveblocks Yjs live sync via `use-excalidraw-yjs.ts`
- **Collaboration:** email sharing like Notes/Kanban; `whiteboard:page:{id}` rooms; viewer = `viewModeEnabled`
- **AI Diagram:** `/api/whiteboard/ai-generate` + OpenRouter `qwen/qwen3.5-flash-02-23` — inserts Excalidraw elements from prompt
- **Export:** PNG via dynamic `exportToBlob` import
- **Sticky notes:** custom toolbar button inserts rectangle+text preset (`lib/whiteboard/sticky-note.ts`)
- **Access:** editors draw + AI; viewers read-only + export; owners manage delete/invites

## Rules

- Minimize scope; match existing patterns; no drive-by refactors
- No todo-app tutorial code; no Stellar/wallet code unless asked
- Commits only when user asks
- Ask user before guessing product requirements
- Landing hero stays **minimal**; full marketing content lives in scroll sections below
- New app features: skeleton page in `app/(app)/` + nav entry in `nav-config.ts` unless user specifies internals

## Verify your changes

`npm run build` (TS/React), `npm run lint` on edited files, `db:generate && db:migrate` after schema edits.
