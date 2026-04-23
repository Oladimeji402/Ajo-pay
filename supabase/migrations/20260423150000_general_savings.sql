-- General savings: separate from target savings goals.
-- Payout dates are platform-fixed:
--   daily  -> last day of every month
--   weekly -> last day of each quarter (Mar 31, Jun 30, Sep 30, Dec 31)
--   monthly -> Dec 31 every year
-- Run this in the Supabase SQL editor.

begin;

-- 1. General savings schemes (one per plan per user)
create table if not exists public.savings_schemes (
  id               uuid        primary key default gen_random_uuid(),
  user_id          uuid        not null references public.profiles (id) on delete cascade,
  name             text        not null,
  frequency        text        not null check (frequency in ('daily', 'weekly', 'monthly')),
  minimum_amount   bigint      not null default 500 check (minimum_amount > 0),
  status           text        not null default 'active' check (status in ('active', 'paused', 'cancelled')),
  created_at       timestamptz not null default timezone('utc', now()),
  updated_at       timestamptz not null default timezone('utc', now())
);

create index if not exists idx_ss_user_id   on public.savings_schemes (user_id);
create index if not exists idx_ss_frequency on public.savings_schemes (frequency);
create index if not exists idx_ss_status    on public.savings_schemes (status);

comment on table public.savings_schemes is
  'User general savings plans with fixed platform payout dates.';

-- 2. Deposits into general savings schemes
create table if not exists public.savings_deposits (
  id          uuid        primary key default gen_random_uuid(),
  scheme_id   uuid        not null references public.savings_schemes (id) on delete cascade,
  user_id     uuid        not null references public.profiles (id) on delete cascade,
  amount      bigint      not null check (amount > 0),
  reference   text        unique not null,
  status      text        not null default 'success' check (status in ('success', 'failed')),
  paid_at     timestamptz not null default timezone('utc', now()),
  created_at  timestamptz not null default timezone('utc', now())
);

create index if not exists idx_sd_scheme_id on public.savings_deposits (scheme_id);
create index if not exists idx_sd_user_id   on public.savings_deposits (user_id);
create index if not exists idx_sd_paid_at   on public.savings_deposits (paid_at);

comment on table public.savings_deposits is
  'Individual wallet payments into a savings scheme. Multiple deposits per period accumulate.';

-- 3. Admin-recorded payouts per scheme
create table if not exists public.passbook_payouts (
  id            uuid        primary key default gen_random_uuid(),
  user_id       uuid        not null references public.profiles (id) on delete cascade,
  scheme_id     uuid        not null references public.savings_schemes (id) on delete cascade,
  amount        bigint      not null check (amount > 0),
  period_label  text        not null default '',
  notes         text        not null default '',
  recorded_by   uuid                     references public.profiles (id) on delete set null,
  paid_at       timestamptz not null default timezone('utc', now()),
  created_at    timestamptz not null default timezone('utc', now())
);

create index if not exists idx_ppo_user_id   on public.passbook_payouts (user_id);
create index if not exists idx_ppo_scheme_id on public.passbook_payouts (scheme_id);
create index if not exists idx_ppo_paid_at   on public.passbook_payouts (paid_at);

comment on table public.passbook_payouts is
  'Admin-recorded disbursements per scheme per user. Populates the Withdrawals row in the passbook.';

-- 4. RLS: users see only their own data; admins bypass via service role.
alter table public.savings_schemes  enable row level security;
alter table public.savings_deposits enable row level security;
alter table public.passbook_payouts enable row level security;

create policy "users_own_schemes"
  on public.savings_schemes for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "users_own_deposits"
  on public.savings_deposits for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "users_own_payouts"
  on public.passbook_payouts for select
  using (user_id = auth.uid());

commit;
