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
4. **Roadmap** — 10-item dev chapter grid (setup/auth/dashboard marked done)
5. **Privacy** — dark section, 3 pillars, sign-up CTA
6. **Footer**

### Navbar behavior

- Transparent over hero, white logo/links/hamburger
- RetroUI Sign in (outline) + Get started (yellow) when signed out; `UserButton` when signed in
- On scroll: solid white bar with black border
- Mobile: full-screen menu with staggered link animations

### Auth flow (current)

- **Redirect only** — `SignInButton` / `SignUpButton` with `mode="redirect"`
- Routes: `/sign-in`, `/sign-up` (Clerk components)
- After auth: redirect to `/dashboard` (`forceRedirectUrl` + `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` / `AFTER_SIGN_UP_URL`)
- Each auth route has a minimal layout with `← Kaizenyard` back link
- Root layout removed `AuthHeader`; landing has its own navbar
- Tried modal/glass auth overlay once — **reverted** per user request; keep route-based auth

### Supporting changes

- `app/globals.css` — hero animation keyframes (`fadeSlideUp`, `scaleIn`, etc.) + `.animate-hero-*` classes
- `app/layout.tsx` — Kaizenyard metadata, `UserSync`, no global header
- `components/user-sync.tsx` + `lib/sync-user.ts` — upsert Clerk users to `users` table
- `db/schema.ts` + migration — `users` table with `clerkId`, `email`, `name`, timestamps

## Dashboard layout (Chapter 3 — done)

### App shell

- Route group `app/(app)/` with `DashboardShell` layout
- **Protected routes** in `proxy.ts`: `/dashboard`, `/assistant`, `/calendar`, `/tasks`, `/notes`, `/whiteboard`, `/pages`, `/templates`, `/settings`
- Skeleton pages only — RetroUI `Card` + “Coming soon” placeholder per route
- **Settings** — full Clerk `UserProfile` at `/settings` (catch-all `[[...rest]]`)

### Sidebar (`components/dashboard/`)

- Neo-brutalist RetroUI: `border-2 border-black`, yellow active state, colorful Lucide icons
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

## Files to know

```
components/landing/
  landing-page.tsx      composer
  landing-navbar.tsx    fixed nav + mobile menu
  hero-section.tsx      video hero
  features-section.tsx
  attestation-section.tsx
  roadmap-section.tsx
  privacy-section.tsx   + LandingFooter
  privacy-cta.tsx

components/dashboard/
  dashboard-shell.tsx     layout + mobile drawer + top bar
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

components/brand/
  logo.tsx

lib/
  mask-email.ts           partial email masking for sidebar
```

## Design decisions (user preferences)

- Hero: **minimal text**, video must stay **clearly visible** (light bottom gradient only, no heavy blur on video)
- Navbar on hero: **fully transparent** (no white/yellow bar)
- Below fold: **keep full marketing sections** — don't strip when simplifying hero
- Auth: **dedicated routes**, not popups
- Sidebar: **do not show full user email** — use `maskEmail()` in compact UI
- Neo-brutalism everywhere in app shell — see `AGENTS.md` design section

## Not done yet

- Feature internals (calendar, kanban, notes, whiteboard, pages, templates, assistant)
- Real global search
- Attestation feature implementation
- Clerk Organizations / workspace switcher (when enabled in Clerk dashboard)
