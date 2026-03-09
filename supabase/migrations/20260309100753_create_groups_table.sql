create table if not exists public.groups (
	id uuid primary key default gen_random_uuid(),
	name text not null,
	category text,
	contribution_amount bigint not null check (contribution_amount > 0),
	frequency text not null check (frequency in ('weekly', 'biweekly', 'monthly')),
	max_members integer not null check (max_members > 1),
	current_cycle integer not null default 1 check (current_cycle > 0),
	total_cycles integer not null check (total_cycles > 0),
	start_date date,
	status text not null default 'pending' check (status in ('pending', 'active', 'completed', 'paused')),
	invite_code text not null unique,
	color text not null default '#3B82F6',
	created_by uuid references public.profiles (id) on delete set null,
	created_at timestamptz not null default timezone('utc', now()),
	updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_groups_status on public.groups (status);
create index if not exists idx_groups_start_date on public.groups (start_date);

