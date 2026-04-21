-- Payment slots for each individual savings goal — these ARE the passbook rows.
-- One row per period (one per day/week/month depending on frequency).
-- period_label: human-readable label shown in passbook, e.g. "Week 3", "October", "Mon Apr 21".
-- period_index: numeric ordering (0-based), used to render passbook table in order.
-- period_date: the actual calendar date this slot represents (start of the period).

create table if not exists public.individual_savings_contributions (
  id                   uuid        primary key default gen_random_uuid(),
  goal_id              uuid        not null references public.individual_savings_goals (id) on delete cascade,
  user_id              uuid        not null references public.profiles (id) on delete cascade,
  amount               bigint      not null check (amount > 0),
  period_label         text        not null,
  period_index         integer     not null check (period_index >= 0),
  period_date          date        not null,
  status               text        not null default 'pending' check (status in ('pending', 'success', 'failed', 'abandoned')),
  paystack_reference   text        unique,
  payment_record_id    uuid                     references public.payment_records (id) on delete set null,
  paid_at              timestamptz              default null,
  created_at           timestamptz not null default timezone('utc', now()),
  updated_at           timestamptz not null default timezone('utc', now()),
  unique (goal_id, period_index)
);

create index if not exists idx_isc_goal_id    on public.individual_savings_contributions (goal_id);
create index if not exists idx_isc_user_id    on public.individual_savings_contributions (user_id);
create index if not exists idx_isc_status     on public.individual_savings_contributions (status);
create index if not exists idx_isc_goal_order on public.individual_savings_contributions (goal_id, period_index);

drop trigger if exists set_isc_updated_at on public.individual_savings_contributions;
create trigger set_isc_updated_at
before update on public.individual_savings_contributions
for each row
execute function public.update_updated_at_column();

-- Automatically refresh goal.total_saved whenever a contribution row changes.
create or replace function public.refresh_goal_total_saved(target_goal_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.individual_savings_goals g
  set total_saved = coalesce((
      select sum(c.amount)
      from public.individual_savings_contributions c
      where c.goal_id = target_goal_id
        and c.status = 'success'
    ), 0),
    updated_at = timezone('utc', now())
  where g.id = target_goal_id;
end;
$$;

create or replace function public.handle_isc_totals_sync()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    perform public.refresh_goal_total_saved(new.goal_id);
    return new;
  elsif tg_op = 'UPDATE' then
    perform public.refresh_goal_total_saved(new.goal_id);
    return new;
  elsif tg_op = 'DELETE' then
    perform public.refresh_goal_total_saved(old.goal_id);
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists sync_isc_totals on public.individual_savings_contributions;
create trigger sync_isc_totals
after insert or update or delete on public.individual_savings_contributions
for each row
execute function public.handle_isc_totals_sync();

comment on table public.individual_savings_contributions is
  'One row per passbook slot for an individual savings goal. These ARE the passbook entries displayed to the user.';
comment on column public.individual_savings_contributions.period_label is
  'Human-readable passbook slot label. Examples: "Week 3", "October", "Mon 21 Apr".';
comment on column public.individual_savings_contributions.period_index is
  '0-based ordering index for rendering the passbook table in correct sequence.';
