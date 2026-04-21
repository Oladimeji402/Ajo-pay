-- Payment allocations for bulk pay: one parent Paystack reference splits into
-- multiple target allocations. Each allocation is processed independently on webhook success.

create table if not exists public.payment_allocations (
  id                uuid        primary key default gen_random_uuid(),
  parent_reference  text        not null,
  user_id           uuid        not null references public.profiles (id) on delete cascade,
  target_type       text        not null check (target_type in ('group', 'individual_goal')),
  target_id         uuid        not null,
  allocated_amount  bigint      not null check (allocated_amount > 0),
  status            text        not null default 'pending' check (status in ('pending', 'success', 'failed')),
  processed_at      timestamptz              default null,
  created_at        timestamptz not null default timezone('utc', now()),
  updated_at        timestamptz not null default timezone('utc', now())
);

create index if not exists idx_pa_parent_reference on public.payment_allocations (parent_reference);
create index if not exists idx_pa_user_id          on public.payment_allocations (user_id);
create index if not exists idx_pa_status           on public.payment_allocations (status);
create index if not exists idx_pa_target           on public.payment_allocations (target_type, target_id);

drop trigger if exists set_pa_updated_at on public.payment_allocations;
create trigger set_pa_updated_at
before update on public.payment_allocations
for each row
execute function public.update_updated_at_column();

comment on table public.payment_allocations is
  'Splits a single bulk Paystack payment across multiple savings targets (groups or individual goals).';
comment on column public.payment_allocations.parent_reference is
  'The Paystack reference for the single transaction that covers all allocations.';
comment on column public.payment_allocations.target_type is
  '"group" targets the contributions flow; "individual_goal" targets individual_savings_contributions.';
