-- Individual savings goals per user, optionally linked to a festive period template.
-- Each goal tracks progress independently. Priority 1 = highest urgency.

create table if not exists public.individual_savings_goals (
  id                   uuid        primary key default gen_random_uuid(),
  user_id              uuid        not null references public.profiles (id) on delete cascade,
  festive_period_id    uuid                     references public.festive_periods (id) on delete set null,
  name                 text        not null,
  description          text        not null default '',
  target_amount        bigint      not null check (target_amount > 0),
  target_date          date        not null,
  savings_start_date   date        not null,
  frequency            text        not null check (frequency in ('daily', 'weekly', 'monthly')),
  contribution_amount  bigint      not null check (contribution_amount > 0),
  priority             integer     not null default 3 check (priority between 1 and 5),
  status               text        not null default 'active' check (status in ('active', 'paused', 'completed', 'cancelled')),
  total_saved          bigint      not null default 0 check (total_saved >= 0),
  auto_debit           boolean     not null default false,
  created_at           timestamptz not null default timezone('utc', now()),
  updated_at           timestamptz not null default timezone('utc', now())
);

create index if not exists idx_isg_user_id         on public.individual_savings_goals (user_id);
create index if not exists idx_isg_festive_period  on public.individual_savings_goals (festive_period_id);
create index if not exists idx_isg_status          on public.individual_savings_goals (status);
create index if not exists idx_isg_user_priority   on public.individual_savings_goals (user_id, priority);

drop trigger if exists set_isg_updated_at on public.individual_savings_goals;
create trigger set_isg_updated_at
before update on public.individual_savings_goals
for each row
execute function public.update_updated_at_column();

comment on table public.individual_savings_goals is
  'Per-user savings goals, optionally based on a festive period template. Each has its own passbook.';
comment on column public.individual_savings_goals.priority is
  '1 = most urgent. Used to sort goals and suggest which to fund first.';
comment on column public.individual_savings_goals.contribution_amount is
  'Fixed amount the user commits to pay each period (daily/weekly/monthly).';
