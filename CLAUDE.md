@AGENTS.md

# CompScope — Competitor Analysis SaaS

A SaaS for tracking YouTube competitors. An **Admin** manages **customer** accounts; each customer
tracks competitor channels, sees their uploads on a colored-dot **timeline**, and (later) queries an
**AI agent wired to their own data**. Full data isolation between customers; admin can see all.

> **Working rules:** Communicate in **English only**. **Update this file on every code/project change.**

## Stack
- Next.js 16 (App Router, Turbopack) · React 19 · TypeScript
- Tailwind v4 (CSS-first `@theme` in `app/globals.css`)
- Supabase: Postgres + Auth + RLS (`@supabase/ssr` 0.12, `@supabase/supabase-js` 2.110, pinned)
- Planned: YouTube Data API v3, an abstracted AI layer (Claude default), pg_cron

## Directory map
- `app/(user)/` — customer app: `dashboard`, `timeline` (core dots + modal), `competitors`,
  `analytics`, `assistant`, `settings`. Layout fetches role, renders `Sidebar`.
- `app/(admin)/admin/users/` — admin: user list + create, `[id]` subscription/password management.
  Layout guards `role === 'admin'`.
- `app/login/` — sign-in (email/password + Google). `LoginForm.tsx` is the client form.
- `app/auth/callback/route.ts` — OAuth code exchange → role-based redirect.
- `app/actions/` — server actions: `auth.ts` (signIn/Google/signOut), `admin.ts` (createUser,
  updatePassword, updateSubscription, deleteUser; each `assertAdmin()`).
- `lib/supabase/` — `client.ts` (browser), `server.ts` (RSC/actions), `admin.ts` (service role, server-only).
- `lib/youtube.ts` — YouTube Data API v3 wrapper (`resolveChannel`, `fetchRecentVideos`; server-only).
- `lib/sync.ts` — `syncCompetitor()` core (fetch + upsert), reused by manual sync and the cron.
- `app/api/cron/sync/route.ts` — daily sync endpoint (auth `Bearer $CRON_SECRET`), logs to `sync_runs`.
- `vercel.json` — Vercel Cron hits `/api/cron/sync` daily at 03:00 UTC.
- `lib/ai/` — provider-swappable AI layer: `chat()` (`index.ts`), `anthropic.ts` adapter, `context.ts`
  (grounds the system prompt in the caller's competitors/videos, RLS-scoped). Default `claude-opus-4-8`.
- `app/api/assistant/route.ts` — chat endpoint; persists to `ai_conversations`/`ai_messages`.
- `lib/queries.ts` — server read helpers + `computeDashboard()` aggregates. `lib/format.ts` — `fmtViews`.
- `app/actions/competitors.ts` — add/remove/sync competitor server actions.
- `components/ui/` — `Sidebar`, `Topbar`, `Card`+`StatusPill`, `Charts` (SVG bar/area, animated).
- `app/(user)/dashboard/DashboardChat.tsx` — compact AI chat embedded on the dashboard's mint card
  (same `/api/assistant` endpoint; "Full assistant" links to `/assistant?c=<id>`).
- `components/icons.tsx` — inline SVG icons (no icon dep).
- `middleware.ts` — session refresh + route gating (unauth → /login, non-admin → /dashboard on /admin/*).
- `supabase/migrations/` — SQL to run in the Supabase SQL Editor.

## Design tokens (from the reference dashboard)
Dark `#0a0a0a` bg with a warm top-left glow (`.app-glow`); lime accent `#c5f04a`; lavender `#b9a3e3`
and mint `#b9e6a8` highlight cards; big rounded corners (`--radius-card`); left icon sidebar; status
pills (hot=lavender, rising=green, flat=grey). **All data tables are dark** except the dashboard's
"Latest Videos" white card (reference look) — the user rejected white tables elsewhere. Topbar shows
brand + stat + avatar only (no search/notifications).
**Motion:** CSS-only in `globals.css` — `.rise` / `.stagger > *` page-load reveals, `.bar-grow(-x)`
chart entrances, `.chart-draw` (needs `pathLength={1}`), `.fade-in`, `.pop-in`; all inside
`prefers-reduced-motion: no-preference`. Apply `stagger` to a page's top-level column.

## Auth & roles
- **Admin-only accounts.** No public sign-up — turn **OFF "Allow new users to sign up"** in Supabase
  Auth. Google + email/password are sign-in only; only admin-created emails can get in.
- Admin seeded by email `abdalrhman.althawabteh@gmail.com` (see migration `0001`). Others = `user`.
- `profiles.role` is the source of truth; `private.is_admin()` (SECURITY DEFINER) drives admin RLS bypass.

## Setup (user does this)
1. `.env.local`: Supabase URL + anon + service-role keys, `YOUTUBE_API_KEY`, `CRON_SECRET`,
   `ANTHROPIC_API_KEY` (+ `AI_PROVIDER=anthropic`).
2. Run migrations in the Supabase SQL Editor in order: `0001_auth_profiles.sql`,
   `0002_competitors_videos.sql`, `0003_sync_runs.sql`, `0004_ai_chat.sql`.
3. Supabase Auth → Providers: enable **Google** (Client ID/Secret from Google Cloud Console;
   redirect URL `<SUPABASE_URL>/auth/v1/callback`).
4. Sign in once with the admin email (creates the admin profile), THEN Supabase Auth →
   Sign In / Providers → turn OFF **"Allow new users to sign up"**.
5. `npm run dev`. Admin → `/admin/users` creates customers. Customers add channels on `/competitors`.

## Commands
- `npm run dev` (dev server) · `npm run build` (typecheck + build) · `npm run lint`

## Status
- **Phase 1 (done):** UI/design system, dashboard, timeline (core), stubs.
- **Phase 2 (done):** Supabase auth, `profiles` + RLS isolation, admin panel (users/subscriptions).
- **Phase 3 (done):** `competitors`/`videos` tables + RLS (`0002`), YouTube ingest, Competitors page,
  real dashboard/timeline data, admin per-user data view. `lib/mock.ts` removed.
- **Phase 4 (done):** daily auto-sync via Vercel Cron → `/api/cron/sync`, `sync_runs` log (`0003`),
  Settings page shows account + sync history. Deploy note: set `CRON_SECRET` in Vercel env; cron runs
  only on production deploys.
- **Phase 5 (done):** AI assistant grounded in each customer's data (`lib/ai/*`, `/api/assistant`),
  chat history in `ai_conversations`/`ai_messages` (`0004`), assistant chat UI, admin sees convo titles.
- **UI overhaul (done):** CSS motion system (staggered reveals, animated charts); dashboard stat tiles
  (competitors / uploads this week / avg views) + embedded `DashboardChat` replacing the ask-the-AI
  link card; Competitors & Settings tables switched to dark (with channel thumbnails); real Analytics
  page (views-share bars + per-competitor cards, top video); `Placeholder` component removed.
