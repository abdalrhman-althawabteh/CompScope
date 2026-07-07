-- 0003_sync_runs.sql
-- Log of scheduled/manual sync executions, one row per owner per run.
-- Run in the Supabase SQL Editor after 0002.

create table if not exists public.sync_runs (
  id                 uuid primary key default gen_random_uuid(),
  owner_id           uuid not null references public.profiles (id) on delete cascade,
  started_at         timestamptz not null default now(),
  finished_at        timestamptz,
  status             text not null default 'running' check (status in ('running', 'success', 'error')),
  source             text not null default 'schedule' check (source in ('schedule', 'manual')),
  competitors_synced int not null default 0,
  videos_upserted    int not null default 0,
  error              text
);

create index if not exists sync_runs_owner_started_idx
  on public.sync_runs (owner_id, started_at desc);

-- RLS: owners read their own runs, admin reads all. Writes happen only via the
-- service-role cron endpoint, which bypasses RLS — so there is no insert/update policy.
alter table public.sync_runs enable row level security;

create policy "sync_runs_select" on public.sync_runs
  for select to authenticated
  using ( owner_id = (select auth.uid()) or private.is_admin() );

grant select on public.sync_runs to authenticated;
