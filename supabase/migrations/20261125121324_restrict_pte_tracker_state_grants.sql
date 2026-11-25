-- Brings the grants on pte_tracker_state back to what the initial schema declares.
-- Checked on 2026-11-25: the live project gave anon and authenticated all table privileges.
-- Afterwards: anon has none, authenticated can select, insert and update. service_role,
-- row level security and policies are left as they are. Safe to run more than once.
--
-- Applied to the live project on 2026-11-25 as migration 20261125121324.
-- Follow supabase/README.md before using db push.
--
-- To undo, restoring what the live project had:
--   grant all on public.pte_tracker_state to anon, authenticated;
begin;

-- Revoke and grant in one transaction, so signed-in users never see a gap.
revoke all on public.pte_tracker_state from public, anon, authenticated;
grant select, insert, update on public.pte_tracker_state to authenticated;

commit;
