# AGENTS.md — Kaizenyard

Read this before changing code.

## Project

Next.js 16 App Router productivity app (early stage). Stack: React 19, TypeScript, Clerk auth, Neon Postgres + Drizzle ORM v1 RC, Tailwind v4, RetroUI components. Single app at repo root — not a monorepo. No product features yet beyond auth + placeholder home page.

## Layout

```
app/           pages, layout, globals.css, sign-in/, sign-up/
components/    auth-header.tsx, retroui/ (UI kit — not components/ui/)
db/            index.ts (db client), schema.ts (tables)
lib/           utils.ts (cn)
proxy.ts       Clerk middleware — use this, NOT middleware.ts
migrations/    Drizzle SQL migrations
```

`@/*` → repo root. No `src/`, `actions/`, `hooks/`, or tests yet.

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
- `ClerkProvider` inside `<body>` in `app/layout.tsx`
- `await auth()` from `@clerk/nextjs/server` — always async
- Use `@clerk/nextjs`, not `@clerk/clerk-react`
- Routes are public by default until you add `auth.protect()`
- **Gap:** `users` table has no `clerkId` / sync — ask before user-scoped features

## Database

```ts
import { db, users } from "@/db";
await db.select().from(users);
```

- Drizzle **v1 RC** (`drizzle-orm@1.0.0-rc.4`) — see `.agents/skills/drizzle-best-practices/SKILL.md`
- Import tables from `@/db`; don't pass `schema` into `drizzle()`
- **Schema drift:** `db/schema.ts` has `users` only; migrations + Neon also have `posts`. Fix before extending DB.

## UI

- Tailwind v4 in `app/globals.css` (`@theme inline`) — no `tailwind.config`
- Fonts: Archivo Black + Space Grotesk in layout
- Use `components/retroui/`, `cn()` from `@/lib/utils`, `next/link` for internal nav
- `retroui/*` has pre-existing lint/build issues — only fix files you touch

## Rules

- Minimize scope; match existing patterns; no drive-by refactors
- No todo-app tutorial code; no Stellar/wallet code unless asked
- Commits only when user asks
- Ask user before guessing product requirements

## Verify your changes

`npm run build` (TS/React), `npm run lint` on edited files, `db:generate && db:migrate` after schema edits.
