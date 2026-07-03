# AGENTS.md — Kaizenyard

Read this before changing code.

## Product

Privacy-first **Web3 productivity app** on Stellar. Core differentiators:

1. **Anonymous attestation** (roadmap) — verified group members can leave feedback without revealing identity
2. **ZK Secure Vaults** (Chapter 8, shipped) — Pages & Spaces folders gated by zero-knowledge unlock proofs verified on Soroban testnet via Freighter

Early stage: auth + marketing landing + dashboard shell + DB user sync. Calendar v2 (Chapter 4+), Kanban (Chapter 5), Notes (Chapter 6), Whiteboard (Chapter 7), **Pages & Spaces + Secure Vaults** (Chapter 8), **AI Template Builder v2** (Chapter 9), **Settings hub** (Chapter 10), and **Kaizen Witness AI Assistant** (Chapter 11: privacy proxy agent + tool calling + Stellar witness attestations) implemented.

**Web3 angle:** Kaizenyard is not a generic SaaS todo app — wallet-connected vault unlock, on-chain nullifier anti-replay, and Circom Groth16 (bls12381) proofs are first-class product features built on **Stellar smart contracts** and **`@stellar/stellar-sdk`**.

## Agent skills (`.agents/skills/`)

Read the matching skill **before** changing code in that domain. Skills live under `.agents/skills/` in this repo.

| Skill | Path | Use when |
|-------|------|----------|
| **dapp** | `.agents/skills/dapp/SKILL.md` | Stellar frontend: `@stellar/stellar-sdk`, Freighter, tx build/simulate/sign/submit, Next.js client/server split, contract invocation from browser |
| **smart-contracts** | `.agents/skills/smart-contracts/SKILL.md` (+ `development.md`, `testing.md`, `security.md`) | Soroban/Rust contracts: `soroban-sdk`, build/deploy, storage, auth, events, upgrades, security review |
| **zk-proofs** | `.agents/skills/zk-proofs/SKILL.md` | Groth16, Circom/snarkjs, BLS12-381 on-chain verify (CAP-0059), vault/privacy circuits, verifier contracts |
| **assets** | `.agents/skills/assets/SKILL.md` | Classic Stellar assets, trustlines, SAC bridge, regulated tokens |
| **data** | `.agents/skills/data/SKILL.md` | Stellar RPC / Horizon queries, simulation, events, indexers |
| **agentic-payments** | `.agents/skills/agentic-payments/SKILL.md` | x402 / MPP paid APIs, agent payment channels (future integrations) |
| **standards** | `.agents/skills/standards/SKILL.md` | SEPs, CAPs, ecosystem reference, which standard applies |
| **drizzle-best-practices** | `.agents/skills/drizzle-best-practices/SKILL.md` | Drizzle ORM v1 RC + Postgres schema, queries, migrations |

**Cross-skill routing:** vault/ZK work → `zk-proofs` + `smart-contracts` + `dapp`. DB/schema work → `drizzle-best-practices`. On-chain reads → `data`. Token/trustline flows → `assets` + `standards`.

## Project

Next.js 16 App Router. Stack: React 19, TypeScript, Clerk auth, Neon Postgres + Drizzle ORM v1 RC, Tailwind v4, RetroUI components, **Stellar (`@stellar/stellar-sdk`, `@stellar/freighter-api`, Soroban contracts, Circom/snarkjs)**. Single app at repo root — not a monorepo.

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
    dashboard/page.tsx         productivity home hub (stats, today, focus, activity, Web3 strip)
    assistant/page.tsx         Kaizen Witness privacy proxy agent (5 modes, tools, voice, LLM View)
    calendar/page.tsx         full calendar (month/week, DnD, drafts)
    tasks/page.tsx             full kanban (boards, columns, DnD, calendar sync, Liveblocks collaboration)
    notes/page.tsx             full notes (Tiptap editor, STT, TTS, AI refine, Liveblocks Yjs sharing)
    whiteboard/page.tsx         full whiteboard (Excalidraw, AI diagrams, PNG export, Liveblocks Yjs sharing)
    pages/page.tsx              full pages & spaces (grid, vaults, Tiptap editor, Liveblocks Yjs)
    templates/page.tsx              AI template builder (prompt → JSON mini apps)
    templates/app/[appId]/page.tsx  generated app runner
    settings/...                  multi-section settings hub (profile, prefs, categories, AI, …)
    settings/account/[[...rest]]/page.tsx   Clerk UserProfile
components/
  landing/                    marketing page sections
  dashboard/                  app shell, sidebar, dashboard home hub
  calendar/                   month/week views, draft panel, DnD, event dialog
  kanban/                     boards sidebar, columns, cards, task dialog, DnD, collaboration, comments
  notes/                      sidebar, Tiptap editor, slash commands, STT, TTS, AI refine, collaboration panel
  whiteboard/                 sidebar, Excalidraw canvas, AI diagrams, sticky notes, collaboration panel
  pages/                      all-spaces grid, space detail, page editor, vault unlock, collaboration panel
  templates/                  AI template builder, dynamic app renderer, generated app cards
  assistant/                  Kaizen Witness chat UI, privacy rail, vault gate, LLM view, witness anchor
  brand/logo.tsx              shared SVG logo
  auth-header.tsx             legacy header (unused; keep for future)
  user-sync.tsx               client: sync Clerk user → DB on visit
  retroui/                    UI kit — not components/ui/
db/                           index.ts, schema.ts
lib/                          utils.ts (cn), sync-user.ts, mask-email.ts, dashboard/, calendar/, kanban/, notes/, whiteboard/, pages/, templates/, assistant/, witness/, stellar/, vault/, liveblocks/
hooks/                        use-freighter.ts (Stellar Freighter wallet), use-assistant-session.ts (assistant chat state)
contracts/vault_verifier/     Soroban ZK vault policy contract (Rust)
contracts/agent_witness_verifier/  Soroban agent witness attestation contract (Rust; testnet deployed)
contracts/app_share_verifier/     Soroban template ZK share contract (Rust; testnet deployed)
circuits/vault_unlock/        Circom Groth16 circuit (bls12381)
circuits/app_share/             Circom Groth16 circuit for template ZK share
app/api/assistant/chat/       Vercel AI SDK tool-loop chat + privacy gateway
app/api/assistant/privacy/llm-view/  Persisted LLM View snapshot (what the model saw)
app/api/assistant/witness/    register-group, build-anchor (Stellar witness flows)
app/api/liveblocks-auth/      Liveblocks room auth (Clerk + board/note/whiteboard role)
app/api/assemblyai/token/     AssemblyAI temporary streaming token
app/api/notes/ai-refine/      OpenRouter text refinement for selected note text (qwen/qwen3.5-flash-02-23)
app/api/whiteboard/ai-generate/ OpenRouter diagram generation for whiteboard (qwen/qwen3.5-flash-02-23)
app/api/templates/ai-generate/  OpenRouter JSON mini-app generation for AI Template Builder
proxy.ts                      Clerk middleware — use this, NOT middleware.ts
migrations/                   Drizzle SQL migrations
memory/                       session notes for agents (memory.md)
```

`@/*` → repo root. No `src/` or `actions/` folder. `hooks/` has Stellar wallet + assistant session hooks.

## Web3 / Stellar stack

Kaizenyard uses **Stellar testnet** for Secure Vaults (hackathon: Stellar Hacks Real-World ZK).

### Packages

- **`@stellar/stellar-sdk`** — RPC client, `TransactionBuilder`, `Operation.invokeContract`, XDR encode/decode, submit/simulate (`lib/stellar/contract.ts`)
- **`@stellar/freighter-api`** — browser wallet connect/sign (`hooks/use-freighter.ts`)
- **`snarkjs`** — browser Groth16 prover for vault unlock + template ZK share (`lib/vault/prover.ts`, `lib/templates/zk-share/prover.ts`; artifacts in `public/zk/` via `./scripts/build-all-zk.sh`)

### On-chain

- **`contracts/vault_verifier/`** — Soroban Rust contract: `register_vault`, `verify_unlock` (commitment + nullifier policy layer; full pairing verify optional)
- **`circuits/vault_unlock/vault_unlock.circom`** — compile with **`-p bls12381`** for CAP-0059 compatibility

### Client libs

```
lib/stellar/config.ts       network, RPC URL, contract ID from env
lib/stellar/contract.ts     build XDR, simulate, submit signed tx via Stellar SDK
lib/vault/commitment.ts     passphrase → field commitment + salt
lib/vault/prover.ts         snarkjs fullProve (falls back if wasm/zkey missing)
lib/vault/session.ts        client session unlock state per spaceId
hooks/use-freighter.ts      Freighter connect / sign / address
```

### Env (Stellar)

`NEXT_PUBLIC_STELLAR_NETWORK=testnet`, `NEXT_PUBLIC_SOROBAN_RPC_URL=https://soroban-testnet.stellar.org`, `NEXT_PUBLIC_VAULT_VERIFIER_CONTRACT_ID`, `NEXT_PUBLIC_AGENT_WITNESS_VERIFIER_CONTRACT_ID`, `NEXT_PUBLIC_APP_SHARE_VERIFIER_CONTRACT_ID` (see README for deployed testnet IDs). Deploy: `./scripts/deploy-stellar-testnet.sh` or `./scripts/deploy-full-web3.sh`.

**Before changing Stellar code:** read `.agents/skills/dapp/SKILL.md` (frontend/SDK) and `.agents/skills/zk-proofs/SKILL.md` (circuits/verify). For contract changes: `.agents/skills/smart-contracts/SKILL.md`.

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
- **`/dashboard` home hub** — productivity snapshot via `getDashboardSnapshot()` in `lib/dashboard/actions.ts`: greeting, quick actions, module stat cards, today's calendar events, weekly focus bar, recent notes / upcoming tasks / assistant chats, Stellar Web3 strip (when contract IDs set), pinned AI apps. UI in `components/dashboard/dashboard-view.tsx` + section panels. Sidebar ⌘K search remains **nav-only** (not global content search).
- **Assistant (Kaizen Witness)** — full privacy proxy agent at `/assistant` with 5 modes (Standard, Blind, Witness, Vault, Delegate), tool calling, session history, AssemblyAI voice, LLM View demo panel, and Stellar witness attestations
- **Settings** — multi-section hub at `/settings` (profile, preferences, categories, AI, notifications, calendar, data export, privacy, integrations, about); Clerk `UserProfile` at `/settings/account`
- **Do not** add `<OrganizationSwitcher />` until Clerk Organizations is enabled in the Clerk dashboard

### Dashboard home key files

```
lib/dashboard/actions.ts       getDashboardSnapshot(), getProductivityOverview()
lib/dashboard/types.ts         DashboardSnapshot, ProductivityOverview
lib/dashboard/date-utils.ts    timezone day bounds, greeting helpers
components/dashboard/dashboard-view.tsx
components/dashboard/dashboard-stat-card.tsx
components/dashboard/dashboard-quick-actions.tsx
components/dashboard/dashboard-today-panel.tsx
components/dashboard/dashboard-focus-panel.tsx
components/dashboard/dashboard-activity-panel.tsx
components/dashboard/dashboard-web3-strip.tsx
components/dashboard/dashboard-pinned-apps.tsx
app/(app)/dashboard/page.tsx   async RSC + Suspense
```

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

`DATABASE_URL`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in`, `NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up`, `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard`, `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard`, `LIVEBLOCKS_SECRET_KEY` (server-only `sk_` key for `/api/liveblocks-auth` — no public Liveblocks key needed), `ASSEMBLYAI_API_KEY` (server-only for `/api/assemblyai/token` and assistant voice), `OPENROUTER_API_KEY` (server-only for `/api/notes/ai-refine`, `/api/whiteboard/ai-generate`, `/api/templates/ai-generate`, and `/api/assistant/chat` via OpenRouter model `qwen/qwen3.5-flash-02-23` and Vercel AI SDK). Optional: `OPENROUTER_HTTP_REFERER`, `OPENROUTER_APP_TITLE` for OpenRouter rankings metadata. **Pages Secure Vaults:** `NEXT_PUBLIC_STELLAR_NETWORK=testnet`, `NEXT_PUBLIC_SOROBAN_RPC_URL`, `NEXT_PUBLIC_VAULT_VERIFIER_CONTRACT_ID` (deploy `contracts/vault_verifier` to testnet). **Template ZK share:** `NEXT_PUBLIC_APP_SHARE_VERIFIER_CONTRACT_ID`. **Agent witness:** `NEXT_PUBLIC_AGENT_WITNESS_VERIFIER_CONTRACT_ID` (deploy `contracts/agent_witness_verifier` to testnet). Do not read or print `.env`.

## Clerk

- `proxy.ts`: `clerkMiddleware()` + `createRouteMatcher` for app routes **and** `/api/liveblocks-auth(.*)`, `/api/assemblyai/token(.*)`, `/api/notes/ai-refine(.*)`, `/api/whiteboard/ai-generate(.*)`, `/api/templates/ai-generate(.*)`, `/api/assistant/chat(.*)`, `/api/assistant/privacy/llm-view(.*)`, `/api/assistant/witness/register-group(.*)`, `/api/assistant/witness/build-anchor(.*)`, `/api/settings/export(.*)`; `await auth.protect()` on match
- `ClerkProvider` inside `<body>` in `app/layout.tsx`, `appearance={{ theme: shadcn }}`
- `await auth()` from `@clerk/nextjs/server` — always async
- Use `@clerk/nextjs`, not `@clerk/clerk-react`
- Routes are public by default until `auth.protect()` is added
- **User sync:** `components/user-sync.tsx` + `lib/sync-user.ts` upsert signed-in users to `users` by `clerkId` (no webhooks)
- Dedicated auth pages: `app/sign-in/[[...sign-in]]/page.tsx`, `app/sign-up/[[...sign-up]]/page.tsx` with minimal `layout.tsx` back-link to `/`
- Settings: custom settings sections + Clerk `UserProfile` at `/settings/account/[[...rest]]`

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
- `spaces`, `pages`, `space_collaborators`, `space_files` — folder-style Pages & Spaces; vault fields on `spaces`; file attachments (base64 in Postgres, 5 MB limit v1); server actions in `lib/pages/actions.ts`, `lib/pages/file-actions.ts`
- `generated_apps` — per-user AI-generated mini apps (`definition` jsonb, `runtimeState` jsonb, sidebar pin fields, `shareToken`, `shareEnabled`, `shareMode`, and ZK share commitment fields); server actions in `lib/templates/actions.ts`
- `generated_app_collaborators` — email sharing for generated apps (`editor` | `viewer`); pending until invitee signs up; access in `lib/templates/access.ts`, invites in `lib/templates/collaboration-actions.ts`
- `user_settings` — per-user preferences, AI config, notifications (jsonb); server actions in `lib/settings/actions.ts`
- `user_categories` — dynamic categories per module (`calendar`, `kanban`, `notes`, `reminder`); CRUD in `lib/settings/categories-actions.ts`
- `assistant_sessions` — per-user chat sessions (`privacyMode`, `agentSessionId`, optional `witnessGroupId`, `delegateAddress`, `llmViewSnapshot` jsonb); actions in `lib/assistant/sessions/actions.ts`
- `assistant_messages` — persisted UIMessage parts per session
- `assistant_privacy_maps` — token ↔ plaintext maps for blind/witness privacy gateway (TTL via `expiresAt`)
- `witness_groups` — owner-scoped attestation groups (`commitment`, `salt`, `stellarNullifierRoot`); actions in `lib/witness/groups.ts`
- `witness_attestations` — anonymous attestations per group (`nullifier` unique, `actionHash`); actions in `lib/witness/attestations.ts`
- `kanban_board_pulses` — board-level witness retro pulses (links to `witness_groups`)

## Kaizen Witness AI Assistant (Chapter 11 — done)

Privacy proxy agent at `/assistant` — Vercel AI SDK tool loop + OpenRouter, five privacy modes, cross-module tool calling, and optional Stellar witness attestations.

### Privacy modes

| Mode | Behavior |
|------|----------|
| `standard` | Direct tool execution; no tokenization |
| `blind` | Client tokenizes PII → server gateway rehydrates for tools → tokenizes results back to LLM |
| `witness` | Blind + anonymous attestations + optional Stellar anchor |
| `vault` | Vault-gated page reads; real Freighter unlock via `VaultGateBanner` + `VaultUnlockDialog` |
| `delegate` | Freighter-bound delegate address on session; delegate-specific tools |

**Server-authoritative:** chat route uses `session.privacyMode` from DB only — client does not send `privacyMode` in the transport body.

### Architecture

```
lib/assistant/
  sessions/actions.ts       session CRUD, message persistence, mode updates
  privacy/
    gateway.ts              tokenize/rehydrate pipeline for tool I/O
    envelope.ts             client-side PII tokenization helpers
    map-store.ts            DB-backed privacy token maps
    llm-view-store.ts       persisted LLM View snapshots (replaces in-memory store)
  tools/                    mode-gated registry + privacyExecute HOF
  overview-actions.ts       count()-based overview (no raw table scans)
  vault-spaces.ts           vault space list for assistant gate
  witness/                  commitment, anchor build, contract invoke, session unlock ids
  actions.ts                re-exports only (no god-module)

lib/witness/                neutral domain — NO imports from lib/assistant/
  groups.ts, attestations.ts, retro-pulse.ts, require-user.ts

hooks/use-assistant-session.ts   sessions, useChat transport, vault unlock ids on send
```

Calendar/kanban witness retro panels import `lib/witness/retro-pulse.ts` — never `lib/assistant/actions`.

### Tool registry

- **Core (all modes):** calendar, kanban, notes, whiteboard, pages, templates, settings, overview
- **Witness only:** witness group registration, attestation, anchor build
- **Delegate only:** delegate wallet tools
- All mutating tools use `needsApproval: true`; privacy modes use `privacyExecute()` HOF in `lib/assistant/tools/privacy-tool.ts`

### API routes

- `POST /api/assistant/chat` — ToolLoopAgent, privacy gateway, tool execution, message persistence
- `GET/POST /api/assistant/privacy/llm-view` — demo panel: what tokens the LLM saw (DB-backed per session)
- `POST /api/assistant/witness/register-group` — create witness group + commitment
- `POST /api/assistant/witness/build-anchor` — build Stellar anchor tx (auth: group participant + attestation ownership)

### UI (`components/assistant/`)

`assistant-page.tsx`, `assistant-sidebar.tsx`, `assistant-chat.tsx`, `assistant-composer.tsx`, `privacy-mode-rail.tsx`, `proxy-chain-indicator.tsx`, `llm-view-drawer.tsx`, `vault-gate-banner.tsx`, `delegate-wallet-chip.tsx`, `witness-anchor-panel.tsx`, voice input, suggestions per mode.

### Witness retro (calendar + kanban)

- `components/calendar/witness-retro-panel.tsx` — meeting retro with anonymous attestations
- `components/kanban/witness-retro-panel.tsx` — board retro pulse panel
- Atomic DB transactions in `lib/witness/retro-pulse.ts` (includes `boardPulseId` back-link)

### Contracts (testnet deployed)

- `contracts/agent_witness_verifier/` — `CCKPLTS3WDKYRC2GHKDGOESRZI4OUIDZGCTYTEIOUIQKSJNHKQPAGBXF`
- Set `NEXT_PUBLIC_AGENT_WITNESS_VERIFIER_CONTRACT_ID` in `.env` and Vercel
- `.gitignore` includes `contracts/**/target/` — never commit Rust build artifacts

### Migrations

`20260702122140_funny_gorgon` (assistant + witness schema), `20260702164656_breezy_devos` (llmViewSnapshot columns)

### Key files

```
app/(app)/assistant/page.tsx
app/api/assistant/chat/route.ts
app/api/assistant/privacy/llm-view/route.ts
app/api/assistant/witness/register-group/route.ts
app/api/assistant/witness/build-anchor/route.ts
hooks/use-assistant-session.ts
lib/assistant/ (see architecture above)
lib/witness/
components/assistant/
components/calendar/witness-retro-panel.tsx
components/kanban/witness-retro-panel.tsx
contracts/agent_witness_verifier/
```

## Liveblocks (Kanban + Notes + Whiteboard + Pages collaboration)

- Packages: `@liveblocks/client`, `@liveblocks/react`, `@liveblocks/node`, `@liveblocks/yjs`, `yjs` (same Liveblocks version)
- **Auth-endpoint mode** — client uses `LiveblocksProvider authEndpoint="/api/liveblocks-auth"`, not `publicApiKey`
- Kanban room per board: `kanban:board:{boardId}` (`lib/kanban/room.ts` — safe for client imports)
- Notes room per page: `notes:page:{noteId}` (`lib/notes/room.ts` — safe for client imports)
- Whiteboard room per page: `whiteboard:page:{whiteboardId}` (`lib/whiteboard/room.ts` — safe for client imports)
- Pages room per page: `pages:page:{pageId}` (`lib/pages/room.ts` — safe for client imports)
- Server access checks: `lib/kanban/access.ts`, `lib/notes/access.ts`, `lib/whiteboard/access.ts`, `lib/pages/access.ts` — **never import from client components** (pulls in `db`)
- Types: `lib/liveblocks/config.ts` — `Presence` (optional `cursor`), `UserMeta`, `ThreadMetadata: { taskId }`, `RoomEvent: board-changed | note-changed | whiteboard-changed | page-changed`
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

## Pages & Spaces (Chapter 8 — done)

Folder-style organization with optional **ZK Secure Vaults** (Web3).

### UX (neo-brutalism + RetroUI only)

- **`/pages`** — All Spaces: hero copy, filter tabs (All / Favorites / Recently Opened / Archived), search, grid/list, **New Space** + **New Page**, space cards (folder icon, owner initials, page/file counts, star + ⋯ menu)
- **`/pages/space/[id]`** — Space folder: ← All Spaces, unified table of **pages + files** (Page Name + “By XX”, Type, Updated, star + ⋯)
- **`/pages/space/[id]/[pageId]`** — Tiptap editor (templates, STT/TTS, Liveblocks Yjs)

### Page / file actions (RetroUI `Menu`)

Rename, Move (space picker), Duplicate, Favorite, Share (copy link), Export (JSON for pages), Archive, Delete. Files: Upload (≤5 MB), Download, same move/rename/archive/delete.

### Data

- `spaces`, `pages`, `space_collaborators`, `space_files`
- Vault fields: `isVault`, `vaultCommitment`, `vaultSalt`, `stellarNullifierRoot`

### Editor & collaboration

- Reuses Notes Tiptap stack (slash commands, STT/TTS bubble menu, autosave)
- Liveblocks Yjs: `pages:page:{pageId}`; registered in `lib/liveblocks/room-auth.ts`

### Secure Vaults (Web3)

- Client-side commitment from passphrase; unlock via **Freighter** + Soroban `vault_verifier.verify_unlock` on testnet
- ZK: `circuits/vault_unlock/vault_unlock.circom` (bls12381) + optional `public/zk/` snarkjs artifacts; `scripts/build-vault-zk.sh`
- Stellar client: `lib/stellar/`, `hooks/use-freighter.ts`, `lib/vault/` (commitment, prover, session)

### Key files

```
lib/pages/actions.ts, file-actions.ts, access.ts, types.ts, room.ts, mappers.ts
lib/pages/download.ts, initials.ts, user-display.ts
components/pages/all-spaces-view.tsx, space-detail-view.tsx, page-editor-view.tsx
components/pages/space-card.tsx, space-actions-menu.tsx, page-actions-menu.tsx
components/pages/new-page-dialog.tsx, upload-file-button.tsx, vault-unlock-dialog.tsx
```

## AI Template Builder (Chapter 9 — v2 done)

Prompt-to-JSON mini apps saved per user with persisted runtime state, optional sidebar pins (max 3), public link sharing, collaborator invites, and optional Stellar-backed ZK-gated share flows.

### UX

- **`/templates`** — prompt input (500 chars), suggestion chips, Vercel AI SDK generation, inline preview, Created Apps grid (Preview, Share, Add/Remove Sidebar, Delete)
- **`/templates/app/[appId]`** — full-page dynamic renderer with debounced runtime autosave + share dialog
- **`/templates/share/[token]`** — public shared app route with optional ZK passphrase gate
- **Sidebar** — pinned apps appear under **AI Generated Apps** + ⌘K search

### Data

- `generated_apps` — `definition` jsonb (sections, actions, sampleData), `runtimeState` jsonb, `sidebarPinned`, `sidebarOrder`, share flags/token, ZK share commitment data
- `generated_app_collaborators` — email invites + accepted collaborator access

### Dynamic renderer blocks

Stats, list, table, form, progress, checklist, tags, chart placeholder, text — RetroUI neo-brutalism with responsive section layouts (`full` / `half` / `third`) and interactive action handlers.

### Key files

```
lib/templates/actions.ts, types.ts, schema.ts, ai-prompt.ts, mappers.ts
lib/templates/access.ts, collaboration-actions.ts, zk-share/*
lib/templates/use-generated-apps.ts, use-pinned-sidebar-apps.ts, use-app-runtime.ts
components/templates/template-builder-view.tsx, generated-app-view.tsx, shared-app-view.tsx, share-app-dialog.tsx, dynamic-app-renderer.tsx
app/api/templates/ai-generate/route.ts
app/(app)/templates/..., app/templates/share/[token]/page.tsx
```

**Note:** `lib/pages/templates.ts` is unrelated (Tiptap starter content for Pages & Spaces).

### Deployment status (2026-07-03)

- All three Soroban contracts deployed to testnet (`scripts/deploy-stellar-testnet.sh`)
- Groth16 browser artifacts built under `public/zk/` and `public/zk/app-share/` (`scripts/build-all-zk.sh`)
- Set `NEXT_PUBLIC_APP_SHARE_VERIFIER_CONTRACT_ID=CD3DAJRJG2XVA65GI3Y7Y3XCLRLYWY4PM5TNMWVCKCIZFT5SN5UOOZHK` in `.env` and Vercel

### Redeploy

```bash
chmod +x scripts/deploy-full-web3.sh
./scripts/deploy-full-web3.sh
```

### Stellar API key note

- Kaizenyard currently relies on public Stellar testnet RPC/Horizon/Friendbot endpoints and **does not require a Stellar API key** for that default setup.
- If we later switch to a third-party RPC provider, use that provider's dashboard/API credentials and update `NEXT_PUBLIC_SOROBAN_RPC_URL`.

## Rules

- Minimize scope; match existing patterns; no drive-by refactors
- No todo-app tutorial code; **Stellar/Freighter/ZK only for Secure Vaults and documented Web3 features** — read `.agents/skills/` before touching chain code
- Commits only when user asks
- Ask user before guessing product requirements
- Landing hero stays **minimal**; full marketing content lives in scroll sections below
- New app features: skeleton page in `app/(app)/` + nav entry in `nav-config.ts` unless user specifies internals

## Verify your changes

`npm run build` (TS/React), `npm run lint` (zero errors target), `db:generate && db:migrate` after schema edits. Never commit `contracts/**/target/` or `.env`.
