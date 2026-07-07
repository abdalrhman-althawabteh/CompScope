-- 0004_ai_chat.sql
-- AI assistant conversations + messages, per-owner RLS isolation.
-- Run in the Supabase SQL Editor after 0003.

create table if not exists public.ai_conversations (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null references public.profiles (id) on delete cascade,
  title      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.ai_conversations (id) on delete cascade,
  owner_id        uuid not null references public.profiles (id) on delete cascade, -- denormalized for RLS
  role            text not null check (role in ('user', 'assistant')),
  content         text not null,
  created_at      timestamptz not null default now()
);

create index if not exists ai_conversations_owner_idx
  on public.ai_conversations (owner_id, updated_at desc);
create index if not exists ai_messages_conversation_idx
  on public.ai_messages (conversation_id, created_at);

-- RLS: own rows, or everything if admin (reuses private.is_admin from 0001).
alter table public.ai_conversations enable row level security;
alter table public.ai_messages enable row level security;

create policy "ai_conversations_select" on public.ai_conversations
  for select to authenticated using ( owner_id = (select auth.uid()) or private.is_admin() );
create policy "ai_conversations_insert" on public.ai_conversations
  for insert to authenticated with check ( owner_id = (select auth.uid()) or private.is_admin() );
create policy "ai_conversations_update" on public.ai_conversations
  for update to authenticated
  using ( owner_id = (select auth.uid()) or private.is_admin() )
  with check ( owner_id = (select auth.uid()) or private.is_admin() );
create policy "ai_conversations_delete" on public.ai_conversations
  for delete to authenticated using ( owner_id = (select auth.uid()) or private.is_admin() );

create policy "ai_messages_select" on public.ai_messages
  for select to authenticated using ( owner_id = (select auth.uid()) or private.is_admin() );
create policy "ai_messages_insert" on public.ai_messages
  for insert to authenticated with check ( owner_id = (select auth.uid()) or private.is_admin() );
create policy "ai_messages_delete" on public.ai_messages
  for delete to authenticated using ( owner_id = (select auth.uid()) or private.is_admin() );

grant select, insert, update, delete on public.ai_conversations to authenticated;
grant select, insert, delete on public.ai_messages to authenticated;
