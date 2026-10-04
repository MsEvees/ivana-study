-- Ivana v5.7 (minC): online Reading Notes.
-- Uses the existing authenticated user and existing resources table.
create table if not exists public.reading_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  resource_id uuid not null references public.resources(id) on delete cascade,
  content text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, resource_id)
);

alter table public.reading_notes enable row level security;

drop policy if exists "reading_notes_select_own" on public.reading_notes;
drop policy if exists "reading_notes_insert_own" on public.reading_notes;
drop policy if exists "reading_notes_update_own" on public.reading_notes;
drop policy if exists "reading_notes_delete_own" on public.reading_notes;

create policy "reading_notes_select_own" on public.reading_notes
  for select using (auth.uid() = user_id);
create policy "reading_notes_insert_own" on public.reading_notes
  for insert with check (auth.uid() = user_id);
create policy "reading_notes_update_own" on public.reading_notes
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "reading_notes_delete_own" on public.reading_notes
  for delete using (auth.uid() = user_id);

create index if not exists reading_notes_user_updated_idx
  on public.reading_notes (user_id, updated_at desc);
create index if not exists reading_notes_resource_idx
  on public.reading_notes (resource_id);
