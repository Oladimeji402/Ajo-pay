-- Unified ledger for all money movements: group contributions, group payouts,
-- individual savings contributions, and passbook activation fee.
-- This is the canonical data source for the user-facing passbook history view.

create table if not exists public.passbook_entries (
  id            uuid        primary key default gen_random_uuid(),
  user_id       uuid        not null references public.profiles (id) on delete cascade,
  entry_type    text        not null check (entry_type in (
                              'group_contribution',
                              'group_payout',
                              'individual_savings',
                              'passbook_activation',
                              'adjustment'
                            )),
  source_id     uuid                     default null,
  source_table  text                     default null,
  group_id      uuid                     references public.groups (id) on delete set null,
  goal_id       uuid                     references public.individual_savings_goals (id) on delete set null,
  amount        bigint      not null check (amount > 0),
  direction     text        not null check (direction in ('debit', 'credit')),
  status        text        not null default 'success' check (status in ('pending', 'success', 'failed', 'abandoned')),
  reference     text                     default null,
  period_label  text                     default null,
  description   text        not null default '',
  happened_at   timestamptz not null default timezone('utc', now()),
  created_at    timestamptz not null default timezone('utc', now())
);

create index if not exists idx_pb_user_id       on public.passbook_entries (user_id);
create index if not exists idx_pb_entry_type    on public.passbook_entries (entry_type);
create index if not exists idx_pb_user_happened on public.passbook_entries (user_id, happened_at desc);
create index if not exists idx_pb_group_id      on public.passbook_entries (group_id);
create index if not exists idx_pb_goal_id       on public.passbook_entries (goal_id);
create index if not exists idx_pb_source        on public.passbook_entries (source_id, source_table);

comment on table public.passbook_entries is
  'Unified debit/credit ledger. Written alongside existing tables — never replaces them. Used to render the passbook history view.';
comment on column public.passbook_entries.source_id is
  'FK to the originating row: contributions.id, individual_savings_contributions.id, payouts.id, or payment_records.id.';
comment on column public.passbook_entries.period_label is
  'The passbook slot label at time of payment, e.g. "Round 3", "Week 2", "October".';
