-- Clear remaining legacy group-savings data after migration to target/general savings.
-- Uses ALTER/UPDATE/DELETE statements so it can be run safely in Supabase SQL editor.

begin;

-- 1) Remove legacy group-linked passbook records.
delete from public.passbook_entries
where entry_type = 'group_payout'
   or group_id is not null
   or source_table in ('contributions', 'payouts');

-- 2) Normalize entry_type constraint to non-group flow only.
alter table if exists public.passbook_entries
  drop constraint if exists passbook_entries_entry_type_check;

alter table if exists public.passbook_entries
  add constraint passbook_entries_entry_type_check
  check (entry_type in ('individual_savings', 'passbook_activation', 'adjustment'));

-- 3) Clear legacy payment record links to group/contribution entities.
update public.payment_records
set contribution_id = null,
    group_id = null
where contribution_id is not null
   or group_id is not null
   or type = 'payout';

-- 4) Remove all legacy group-domain rows.
delete from public.group_members;
delete from public.contributions;
delete from public.payouts;
delete from public.groups;

-- 5) Clean legacy notifications tied to group workflows.
delete from public.notifications
where type in ('group_member_removed', 'group_joined', 'contribution_due', 'payout_due', 'payout_sent');

commit;
