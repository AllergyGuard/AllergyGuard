-- Phase 4: barcode scans.
--
-- One row per check: a snapshot of what was looked up and the verdict at that
-- moment. Rows are never updated (there is no update policy), so a result page
-- always shows exactly what the user saw. Owned through profiles, like every
-- other profile table.

create type public.scan_verdict as enum ('safe', 'caution', 'unsafe');

create table public.scans (
  id                 uuid primary key default gen_random_uuid(),
  profile_id         uuid not null references public.profiles (id) on delete cascade,
  barcode            text not null check (barcode ~ '^[0-9]{8,14}$'),
  input              text not null check (input in ('camera', 'manual')),
  product_found      boolean not null,
  product_name       text check (product_name is null or char_length(product_name) <= 500),
  brands             text check (brands is null or char_length(brands) <= 500),
  -- The ingredient text that was checked, exactly as received.
  ingredients_text   text check (ingredients_text is null or char_length(ingredients_text) <= 20000),
  declared_allergens text[] not null default '{}',
  declared_traces    text[] not null default '{}',
  -- Plain-language reasons the product data may be incomplete (shown with the result).
  data_notes         text[] not null default '{}',
  verdict            public.scan_verdict not null,
  -- The full checkAllergens() result: explanation, matches, warnings.
  result             jsonb not null,
  off_last_modified  timestamptz,
  created_at         timestamptz not null default now()
);

create index scans_profile_created_idx on public.scans (profile_id, created_at desc);

alter table public.scans enable row level security;

create policy "scans_select_own" on public.scans
  for select to authenticated
  using (exists (select 1 from public.profiles p
                 where p.id = profile_id and p.owner_id = (select auth.uid())));

create policy "scans_insert_own" on public.scans
  for insert to authenticated
  with check (exists (select 1 from public.profiles p
                      where p.id = profile_id and p.owner_id = (select auth.uid())));

create policy "scans_delete_own" on public.scans
  for delete to authenticated
  using (exists (select 1 from public.profiles p
                 where p.id = profile_id and p.owner_id = (select auth.uid())));
