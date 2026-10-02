-- Ivana V5 profile foundation.
-- Safe for Supabase production: no passwords or secrets are stored here.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Profiles are viewable by owner" on public.profiles;
create policy "Profiles are viewable by owner"
on public.profiles for select
to authenticated
using (auth.uid() = id);

drop policy if exists "Profiles are insertable by owner" on public.profiles;
create policy "Profiles are insertable by owner"
on public.profiles for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "Profiles are updatable by owner" on public.profiles;
create policy "Profiles are updatable by owner"
on public.profiles for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

create or replace function public.handle_new_ivana_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''))
  on conflict (id) do update
    set display_name = excluded.display_name,
        updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_ivana on auth.users;
create trigger on_auth_user_created_ivana
after insert on auth.users
for each row execute procedure public.handle_new_ivana_user();
