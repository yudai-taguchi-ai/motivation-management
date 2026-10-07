-- 1日1行。曲線・場所・メモ・カフェインをまとめて持つ
create table public.days (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  date date not null,
  mood jsonb not null default '[]'::jsonb,
  places jsonb not null default '[]'::jsonb,
  notes jsonb not null default '[]'::jsonb,
  caffeine jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, date)
);

alter table public.days enable row level security;

create policy "days_select_own" on public.days
  for select to authenticated using ((select auth.uid()) = user_id);

create policy "days_insert_own" on public.days
  for insert to authenticated with check ((select auth.uid()) = user_id);

create policy "days_update_own" on public.days
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "days_delete_own" on public.days
  for delete to authenticated using ((select auth.uid()) = user_id);
