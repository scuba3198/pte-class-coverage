-- Run with psql -v ON_ERROR_STOP=1 -f supabase/tests/access.sql.
begin;
create function pg_temp.assert(ok boolean, message text) returns void language plpgsql as $$
begin
  if ok is distinct from true then raise exception '%', message; end if;
end $$;
create function pg_temp.expect_denied(statement text) returns void language plpgsql as $$
begin
  begin
    execute statement;
  exception when insufficient_privilege then return;
  end;
  raise exception 'Expected permission denied: %', statement;
end $$;
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-000000000001', 'migration-test-1@example.invalid', '{}'),
  ('00000000-0000-0000-0000-000000000002', 'migration-test-2@example.invalid', '{}');

insert into public.pte_tracker_state (user_id, data) values
  ('00000000-0000-0000-0000-000000000002', '{}'::jsonb);
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

insert into public.pte_tracker_state (user_id, data) values
  ('00000000-0000-0000-0000-000000000001', '{}'::jsonb);
select pg_temp.assert((select count(*) = 1 from public.pte_tracker_state), 'Only own row is visible');
update public.pte_tracker_state set data = '{"checked":true}'::jsonb where user_id = auth.uid();
select pg_temp.assert((select data = '{"checked":true}'::jsonb from public.pte_tracker_state), 'Owner update succeeds');
select pg_temp.expect_denied($q$insert into public.pte_tracker_state (user_id, data)
  values ('00000000-0000-0000-0000-000000000002', '{}'::jsonb)$q$);
select pg_temp.expect_denied($q$update public.pte_tracker_state
  set user_id = '00000000-0000-0000-0000-000000000002' where user_id = auth.uid()$q$);
with changed as (update public.pte_tracker_state set data = '{"checked":true}'::jsonb
  where user_id = '00000000-0000-0000-0000-000000000002' returning *)
select pg_temp.assert((select count(*) = 0 from changed), 'Cannot update another user');
select pg_temp.expect_denied('delete from public.pte_tracker_state');
reset role;
set local role anon;
select pg_temp.expect_denied('select * from public.pte_tracker_state');
select pg_temp.expect_denied($q$insert into public.pte_tracker_state (user_id, data)
  values ('00000000-0000-0000-0000-000000000001', '{}'::jsonb)$q$);
reset role;
set local role service_role;
select pg_temp.assert((select count(*) = 2 from public.pte_tracker_state), 'Service role can access both rows');
reset role;
rollback;
