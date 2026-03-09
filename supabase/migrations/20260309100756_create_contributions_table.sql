create table if not exists public.contributions (
	id uuid primary key default gen_random_uuid(),
	user_id uuid not null references public.profiles (id) on delete cascade,
	group_id uuid not null references public.groups (id) on delete cascade,
	cycle_number integer not null check (cycle_number > 0),
	amount bigint not null check (amount > 0),
	status text not null default 'pending' check (status in ('pending', 'success', 'failed')),
	paystack_reference text unique,
	paid_at timestamptz,
	created_at timestamptz not null default timezone('utc', now()),
	updated_at timestamptz not null default timezone('utc', now()),
	unique (user_id, group_id, cycle_number)
);

create index if not exists idx_contributions_user on public.contributions (user_id);
create index if not exists idx_contributions_group_cycle on public.contributions (group_id, cycle_number);
create index if not exists idx_contributions_status on public.contributions (status);

