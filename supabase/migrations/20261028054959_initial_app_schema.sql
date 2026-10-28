-- Fresh-database baseline captured from the live schema on 2026-10-28.
-- Existing projects: follow supabase/README.md before using db push.
begin;

create table public.pte_tracker_state (
  "id" uuid default gen_random_uuid() not null,
  "user_id" uuid not null,
  "data" jsonb not null,
  "updated_at" timestamp with time zone default now(),
  PRIMARY KEY (id),
  FOREIGN KEY (user_id) REFERENCES auth.users(id),
  UNIQUE (user_id)
);
alter table public.pte_tracker_state enable row level security;


grant usage on schema public to authenticated, service_role;
revoke all on public.pte_tracker_state from public, anon, authenticated;
grant select, insert, update on public.pte_tracker_state to authenticated;
grant select, insert, update, delete on public.pte_tracker_state to service_role;
create policy "own_select" on public.pte_tracker_state
  for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "own_insert" on public.pte_tracker_state
  for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "own_update" on public.pte_tracker_state
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

commit;
