-- 0002_competitors_videos.sql
-- Competitor channels + their fetched videos, with per-owner RLS isolation.
-- Run in the Supabase SQL Editor after 0001.

-- ── competitors: channels a customer tracks ──
create table if not exists public.competitors (
  id                   uuid primary key default gen_random_uuid(),
  owner_id             uuid not null references public.profiles (id) on delete cascade,
  youtube_channel_id   text not null,
  handle               text,
  channel_title        text,
  thumbnail_url        text,
  uploads_playlist_id  text,
  color                text not null,
  last_synced_at       timestamptz,
  created_at           timestamptz not null default now(),
  unique (owner_id, youtube_channel_id)
);

-- ── videos: recent uploads fetched per competitor ──
-- owner_id is denormalized so RLS is a direct equality (no per-row join).
create table if not exists public.videos (
  id                uuid primary key default gen_random_uuid(),
  competitor_id     uuid not null references public.competitors (id) on delete cascade,
  owner_id          uuid not null references public.profiles (id) on delete cascade,
  youtube_video_id  text not null,
  title             text,
  url               text,
  published_at      timestamptz,
  view_count        bigint,
  like_count        bigint,
  comment_count     bigint,
  duration          text,
  thumbnail_url     text,
  fetched_at        timestamptz not null default now(),
  unique (competitor_id, youtube_video_id)
);

create index if not exists videos_owner_published_idx on public.videos (owner_id, published_at desc);
create index if not exists videos_competitor_idx on public.videos (competitor_id);
create index if not exists competitors_owner_idx on public.competitors (owner_id);

-- ── RLS: own rows, or everything if admin (reuses private.is_admin from 0001) ──
alter table public.competitors enable row level security;
alter table public.videos enable row level security;

create policy "competitors_select" on public.competitors
  for select to authenticated
  using ( owner_id = (select auth.uid()) or private.is_admin() );
create policy "competitors_insert" on public.competitors
  for insert to authenticated
  with check ( owner_id = (select auth.uid()) or private.is_admin() );
create policy "competitors_update" on public.competitors
  for update to authenticated
  using ( owner_id = (select auth.uid()) or private.is_admin() )
  with check ( owner_id = (select auth.uid()) or private.is_admin() );
create policy "competitors_delete" on public.competitors
  for delete to authenticated
  using ( owner_id = (select auth.uid()) or private.is_admin() );

create policy "videos_select" on public.videos
  for select to authenticated
  using ( owner_id = (select auth.uid()) or private.is_admin() );
create policy "videos_insert" on public.videos
  for insert to authenticated
  with check ( owner_id = (select auth.uid()) or private.is_admin() );
create policy "videos_update" on public.videos
  for update to authenticated
  using ( owner_id = (select auth.uid()) or private.is_admin() )
  with check ( owner_id = (select auth.uid()) or private.is_admin() );
create policy "videos_delete" on public.videos
  for delete to authenticated
  using ( owner_id = (select auth.uid()) or private.is_admin() );

grant select, insert, update, delete on public.competitors to authenticated;
grant select, insert, update, delete on public.videos to authenticated;
