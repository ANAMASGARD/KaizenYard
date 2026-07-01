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
4. **Roadmap** — 10-item dev chapter grid (setup/auth marked done)
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
- After auth: `forceRedirectUrl="/"`
- Each auth route has a minimal layout with `← Kaizenyard` back link
- Root layout removed `AuthHeader`; landing has its own navbar
- Tried modal/glass auth overlay once — **reverted** per user request; keep route-based auth

### Supporting changes

- `app/globals.css` — hero animation keyframes (`fadeSlideUp`, `scaleIn`, etc.) + `.animate-hero-*` classes
- `app/layout.tsx` — Kaizenyard metadata, `UserSync`, no global header
- `components/user-sync.tsx` + `lib/sync-user.ts` — upsert Clerk users to `users` table
- `db/schema.ts` + migration — `users` table with `clerkId`, `email`, `name`, timestamps

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
```

## Design decisions (user preferences)

- Hero: **minimal text**, video must stay **clearly visible** (light bottom gradient only, no heavy blur on video)
- Navbar on hero: **fully transparent** (no white/yellow bar)
- Below fold: **keep full marketing sections** — don't strip when simplifying hero
- Auth: **dedicated routes**, not popups

## Not done yet

- Dashboard / app shell after login
- Attestation feature implementation
- Product features from roadmap (kanban, notes, etc.)
