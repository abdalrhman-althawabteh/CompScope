# Deploying CompScope on Vercel

Production URL: **https://comp-scope.vercel.app**
Repo: `github.com/abdalrhman-althawabteh/CompScope` (branch `main`)

Vercel auto-deploys every push to `main`. The steps below are the one-time config
outside the code (Supabase + Google + Vercel env vars).

---

## 1. Vercel environment variables
Set for **Production** (and Preview if you want preview deploys to log in). Values come
from your local `.env.local`. Changing any of these needs a **redeploy** to take effect —
the `NEXT_PUBLIC_*` ones are compiled into the build.

| Variable | Source |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → API → anon/publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → API → service_role key (server-only secret) |
| `YOUTUBE_API_KEY` | Google Cloud → YouTube Data API v3 key |
| `ANTHROPIC_API_KEY` | console.anthropic.com |
| `AI_PROVIDER` | `anthropic` |
| `CRON_SECRET` | any long random string (Vercel auto-sends it to the cron route) |

`AI_MODEL` optional (defaults to `claude-opus-4-8`).

## 2. Auth redirect config — fixes the "redirects to localhost" bug
The app requests a redirect back to its own origin, but Supabase only honors it if the
URL is allow-listed; otherwise it falls back to **Site URL**. If Site URL is localhost,
login lands on localhost. Fix both fields:

**Supabase → Authentication → URL Configuration**
- **Site URL:** `https://comp-scope.vercel.app`
- **Redirect URLs** (add each):
  - `https://comp-scope.vercel.app/**`
  - `http://localhost:3000/**` (keeps local dev working)

**Google Cloud Console → APIs & Services → Credentials → OAuth client → Authorized
redirect URIs** — points at Supabase, NOT Vercel, and does not change with your domain:
- `https://<YOUR-PROJECT>.supabase.co/auth/v1/callback`

Supabase config takes effect immediately — no redeploy. Test login in an incognito window.

## 3. Database migrations (once per Supabase project)
Supabase → SQL Editor, run in order: `0001_auth_profiles.sql`, `0002_competitors_videos.sql`,
`0003_sync_runs.sql`, `0004_ai_chat.sql`. Skip if the project already has them.

## 4. First login & lock down signups
1. Visit `/login`, sign in once with the admin email `abdalrhman.althawabteh@gmail.com`
   (creates the admin profile per migration `0001`).
2. Supabase → Authentication → Sign In / Providers → turn **OFF "Allow new users to sign up."**
   After this, only admin-created emails can log in.
3. As admin, create customers at `/admin/users`.

## 5. Cron (daily sync)
`vercel.json` schedules `/api/cron/sync` daily at 03:00 UTC. Vercel auto-sends `CRON_SECRET`
as the auth header, so just set that env var. Cron runs on **Production only**.

## Custom domain later
If you add one (e.g. `app.yourdomain.com`), also add it to Supabase Site URL + Redirect URLs
(section 2), or login breaks on the new domain.
