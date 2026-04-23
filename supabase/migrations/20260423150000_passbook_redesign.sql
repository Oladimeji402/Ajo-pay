-- Passbook redesign: accumulative per-period contributions, admin payouts, minimum amounts.
-- Run this in the Supabase SQL editor.

begin;

-- 1. Drop the one-slot-per-period constraint so multiple payments can accumulate in the same period.
alter table if exists public.individual_savings_contributions
  drop constraint if exists individual_savings_contributions_goal_id_period_index_key;

-- 2. Add admin-configurable minimum contribution amount per goal (default 500 NGN).
alter table if exists public.individual_savings_goals
  add column if not exists minimum_amount bigint not null default 500 check (minimum_amount > 0);

-- 3. Passbook payouts — admin records disbursements per goal per user.
create table if not exists public.passbook_payouts (
  id            uuid        primary key default gen_random_uuid(),
  user_id       uuid        not null references public.profiles (id) on delete cascade,
  goal_id       uuid        not null references public.individual_savings_goals (id) on delete cascade,
  amount        bigint      not null check (amount > 0),
  frequency     text        not null check (frequency in ('daily', 'weekly', 'monthly')),
  period_label  text        not null default '',
  notes         text        not null default '',
  recorded_by   uuid                     references public.profiles (id) on delete set null,
  paid_at       timestamptz not null default timezone('utc', now()),
  created_at    timestamptz not null default timezone('utc', now())
);

create index if not exists idx_ppo_user_id on public.passbook_payouts (user_id);
create index if not exists idx_ppo_goal_id on public.passbook_payouts (goal_id);
create index if not exists idx_ppo_paid_at on public.passbook_payouts (paid_at);

comment on table public.passbook_payouts is
  'Admin-recorded disbursements for individual savings goals. Populates the Withdrawals row in the user passbook.';

commit;
