# AGENTS.md — Kaizenyard

Read this before changing code.

## Product

Privacy-first productivity app. Core differentiator: **anonymous feedback / attestation** — verified customers or employees can leave feedback provably from a real group member, without identifying who.

Early stage: auth + marketing landing page + DB user sync. App features (dashboard, kanban, etc.) not built yet.

## Project

Next.js 16 App Router. Stack: React 19, TypeScript, Clerk auth, Neon Postgres + Drizzle ORM v1 RC, Tailwind v4, RetroUI components. Single app at repo root — not a monorepo.

## Layout

```
app/
  page.tsx              landing (marketing home)
  layout.tsx            ClerkProvider, UserSync, metadata
  globals.css           theme + hero animation keyframes
  sign-in/              Clerk sign-in + back-link layout
  sign-up/              Clerk sign-up + back-link layout
components/
  landing/              marketing page sections (see below)
  auth-header.tsx       legacy header (not used on landing; keep for future app shell)
  user-sync.tsx         client: sync Clerk user → DB on visit
  retroui/              UI kit — not components/ui/
db/                     index.ts, schema.ts
lib/                    utils.ts (cn), sync-user.ts
proxy.ts                Clerk middleware — use this, NOT middleware.ts
migrations/             Drizzle SQL migrations
memory/                 session notes for agents (memory.md)
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

**Auth on landing:** `SignInButton` / `SignUpButton` with `mode="redirect"` → `/sign-in` and `/sign-up`. `forceRedirectUrl="/"` after auth. **Do not** use modal/popup auth unless explicitly requested.

**Design:** Neo-brutalism — Archivo Black + Space Grotesk, yellow primary, `border-2 border-black`, hard shadows. Hero uses cinematic animations defined in `globals.css` (`.animate-hero-*`).

## Commands

```bash
npm run dev | build | lint
npm run db:generate | db:migrate   # schema changes: edit schema → generate → migrate
```

Add RetroUI: `npx shadcn@latest add @retroui/<name>` → `components/retroui/`

## Env (copy .env.example → .env, never commit)

`DATABASE_URL`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in`, `NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up`, redirect URLs to `/`. Do not read or print `.env`.

## Clerk

- `proxy.ts`: `clerkMiddleware()`, matcher includes `/(api|trpc)(.*)` and `/__clerk/(.*)`
- `ClerkProvider` inside `<body>` in `app/layout.tsx`, `appearance={{ theme: shadcn }}`
- `await auth()` from `@clerk/nextjs/server` — always async
- Use `@clerk/nextjs`, not `@clerk/clerk-react`
- Routes are public by default until you add `auth.protect()`
- **User sync:** `components/user-sync.tsx` + `lib/sync-user.ts` upsert signed-in users to `users` by `clerkId` (no webhooks)
- Dedicated auth pages: `app/sign-in/[[...sign-in]]/page.tsx`, `app/sign-up/[[...sign-up]]/page.tsx` with minimal `layout.tsx` back-link to `/`

## Database

```ts
import { db, users } from "@/db";
await db.select().from(users);
```

- Drizzle **v1 RC** (`drizzle-orm@1.0.0-rc.4`) — see `.agents/skills/drizzle-best-practices/SKILL.md`
- Import tables from `@/db`; don't pass `schema` into `drizzle()`
- `users` table: `clerkId` (unique), `email`, `name`, timestamps

## UI

- Tailwind v4 in `app/globals.css` (`@theme inline`) — no `tailwind.config`
- Fonts: Archivo Black (`font-head`) + Space Grotesk (`font-sans`) in layout
- Use `components/retroui/`, `cn()` from `@/lib/utils`, `next/link` for internal nav
- `retroui/*` has pre-existing lint/build issues — only fix files you touch

## Rules

- Minimize scope; match existing patterns; no drive-by refactors
- No todo-app tutorial code; no Stellar/wallet code unless asked
- Commits only when user asks
- Ask user before guessing product requirements
- Landing hero stays **minimal**; full marketing content lives in scroll sections below

## Verify your changes

`npm run build` (TS/React), `npm run lint` on edited files, `db:generate && db:migrate` after schema edits.
