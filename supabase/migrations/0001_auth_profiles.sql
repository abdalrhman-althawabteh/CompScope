-- 0001_auth_profiles.sql
-- Profiles table, admin role, new-user trigger, and RLS isolation.
-- Run this in the Supabase SQL Editor (or `supabase db push`).

-- ── Private schema for security-definer helpers (NOT exposed to the Data API) ──
create schema if not exists private;

-- ── profiles: one row per auth user ──
create table if not exists public.profiles (
  id                     uuid primary key references auth.users (id) on delete cascade,
  email                  text,
  full_name              text,
  role                   text not null default 'user' check (role in ('admin', 'user')),
  subscription_tier      text not null default 'free',
  subscription_status    text not null default 'active' check (subscription_status in ('active', 'paused', 'canceled')),
  subscription_expires_at timestamptz,
  created_at             timestamptz not null default now()
);

-- ── New auth user → create profile. Seed the admin by email. ──
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    case when new.email = 'abdalrhman.althawabteh@gmail.com' then 'admin' else 'user' end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── is_admin(): security-definer so it reads profiles WITHOUT triggering RLS recursion. ──
create or replace function private.is_admin()
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

grant usage on schema private to authenticated;
grant execute on function private.is_admin() to authenticated;

-- ── RLS ──
alter table public.profiles enable row level security;

-- Read: own row, or everything if admin.
create policy "profiles_select" on public.profiles
  for select to authenticated
  using ( id = (select auth.uid()) or private.is_admin() );

-- Write (insert/update/delete): admin only — role & subscription are admin-controlled.
create policy "profiles_admin_insert" on public.profiles
  for insert to authenticated
  with check ( private.is_admin() );

create policy "profiles_admin_update" on public.profiles
  for update to authenticated
  using ( private.is_admin() )
  with check ( private.is_admin() );

create policy "profiles_admin_delete" on public.profiles
  for delete to authenticated
  using ( private.is_admin() );

grant select, insert, update, delete on public.profiles to authenticated;
