-- Backfill passbook_entries from existing successful contributions.
-- Safe to run multiple times: ON CONFLICT DO NOTHING prevents duplicates.
-- Also backfills group payouts if a public.payouts table exists.

-- 1. Group contributions → passbook_entries (group_contribution debits).
insert into public.passbook_entries (
  user_id,
  entry_type,
  source_id,
  source_table,
  group_id,
  goal_id,
  amount,
  direction,
  status,
  reference,
  period_label,
  description,
  happened_at,
  created_at
)
select
  c.user_id,
  'group_contribution'                        as entry_type,
  c.id                                        as source_id,
  'contributions'                             as source_table,
  c.group_id,
  null                                        as goal_id,
  c.amount,
  'debit'                                     as direction,
  c.status,
  c.paystack_reference                        as reference,
  'Round ' || c.cycle_number                  as period_label,
  'Group contribution — ' || coalesce(g.name, 'Unknown group') as description,
  coalesce(c.paid_at, c.created_at)           as happened_at,
  c.created_at
from public.contributions c
left join public.groups g on g.id = c.group_id
where c.status = 'success'
on conflict do nothing;

-- 2. Payouts → passbook_entries (group_payout credits), if the payouts table exists.
do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name   = 'payouts'
  ) then
    insert into public.passbook_entries (
      user_id,
      entry_type,
      source_id,
      source_table,
      group_id,
      goal_id,
      amount,
      direction,
      status,
      reference,
      period_label,
      description,
      happened_at,
      created_at
    )
    select
      p.user_id,
      'group_payout'                            as entry_type,
      p.id                                      as source_id,
      'payouts'                                 as source_table,
      p.group_id,
      null                                      as goal_id,
      p.amount,
      'credit'                                  as direction,
      'success'                                 as status,
      p.paystack_transfer_reference             as reference,
      'Round ' || p.cycle_number                as period_label,
      'Payout received from ' || coalesce(g.name, 'Unknown group') as description,
      coalesce(p.marked_done_at, p.created_at)  as happened_at,
      p.created_at
    from public.payouts p
    left join public.groups g on g.id = p.group_id
    where p.status = 'done'
    on conflict do nothing;
  end if;
end;
$$;
