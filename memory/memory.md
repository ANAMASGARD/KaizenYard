# Kaizenyard — session memory

Last updated: 2026-07-01

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
- Skeleton pages only — RetroUI `Card` + “Coming soon” placeholder per route (except **Calendar** — full feature)
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
  calendar/               categories, date-utils, server actions, types
  sync-user.ts            Clerk → users upsert
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

- Feature internals (tasks/kanban, notes, whiteboard, pages, templates, assistant)
- Real global search
- Attestation feature implementation
- Clerk Organizations / workspace switcher (when enabled in Clerk dashboard)
