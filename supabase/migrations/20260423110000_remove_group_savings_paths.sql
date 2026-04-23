-- Move platform rules to individual-savings-only paths.
-- This migration intentionally uses ALTER statements so it can be run
-- directly in Supabase SQL editor on existing projects.

begin;

-- 1) Stop new "group" allocations in bulk payments.
alter table if exists public.payment_allocations
  drop constraint if exists payment_allocations_target_type_check;

alter table if exists public.payment_allocations
  add constraint payment_allocations_target_type_check
  check (target_type in ('individual_goal'));

-- 2) Restrict payment_records type values away from group contribution flows.
-- Map old group-based rows so the new constraint validates on existing data.
update public.payment_records
set type = 'individual_savings'
where type in ('contribution', 'bulk_contribution');

alter table if exists public.payment_records
  drop constraint if exists payment_records_type_check;

alter table if exists public.payment_records
  add constraint payment_records_type_check
  check (type in ('payout', 'passbook_activation', 'individual_savings'));

-- 3) Keep passbook entries consistent with individual-only debits going forward.
update public.passbook_entries
set entry_type = 'individual_savings'
where entry_type = 'group_contribution';

alter table if exists public.passbook_entries
  drop constraint if exists passbook_entries_entry_type_check;

alter table if exists public.passbook_entries
  add constraint passbook_entries_entry_type_check
  check (entry_type in ('group_payout', 'individual_savings', 'passbook_activation', 'adjustment'));

commit;
