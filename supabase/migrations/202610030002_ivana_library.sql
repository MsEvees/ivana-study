-- Ivana V5.3 Library foundation.
-- Stores source metadata in Postgres and private source files in Supabase Storage.
-- Each row belongs to the authenticated Ivana user who created it.

create extension if not exists pgcrypto;

create table if not exists public.resources (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  source_type text not null check (source_type in ('syllabus','book','research_paper','other')),
  input_mode text not null default 'file' check (input_mode in ('file','text')),
  title text not null,
  file_name text,
  storage_path text,
  mime_type text,
  size_bytes bigint not null default 0,
  author text,
  year text,
  edition text,
  publisher text,
  institution text,
  school_year text,
  semester text,
  course_code text,
  courses text[] not null default '{}',
  instructor text,
  toc text,
  content_text text,
  content_html text,
  in_map boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists resources_owner_created_idx
  on public.resources(owner_id, created_at desc);

create index if not exists resources_owner_course_idx
  on public.resources(owner_id, course_code);

alter table public.resources enable row level security;

drop policy if exists "Resources are viewable by owner" on public.resources;
create policy "Resources are viewable by owner"
on public.resources for select
to authenticated
using (auth.uid() = owner_id);

drop policy if exists "Resources are insertable by owner" on public.resources;
create policy "Resources are insertable by owner"
on public.resources for insert
to authenticated
with check (auth.uid() = owner_id);

drop policy if exists "Resources are updatable by owner" on public.resources;
create policy "Resources are updatable by owner"
on public.resources for update
to authenticated
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

drop policy if exists "Resources are deletable by owner" on public.resources;
create policy "Resources are deletable by owner"
on public.resources for delete
to authenticated
using (auth.uid() = owner_id);

-- Private bucket: browser clients can only access objects through Storage policies below.
insert into storage.buckets (id, name, public)
values ('study-materials', 'study-materials', false)
on conflict (id) do update set public = false;

drop policy if exists "Study materials are viewable by owner" on storage.objects;
create policy "Study materials are viewable by owner"
on storage.objects for select
to authenticated
using (
  bucket_id = 'study-materials'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Study materials are uploadable by owner" on storage.objects;
create policy "Study materials are uploadable by owner"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'study-materials'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Study materials are updatable by owner" on storage.objects;
create policy "Study materials are updatable by owner"
on storage.objects for update
to authenticated
using (
  bucket_id = 'study-materials'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'study-materials'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Study materials are deletable by owner" on storage.objects;
create policy "Study materials are deletable by owner"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'study-materials'
  and (storage.foldername(name))[1] = auth.uid()::text
);
