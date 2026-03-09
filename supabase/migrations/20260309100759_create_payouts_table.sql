create table if not exists public.payouts (
	id uuid primary key default gen_random_uuid(),
	group_id uuid not null references public.groups (id) on delete cascade,
	user_id uuid not null references public.profiles (id) on delete cascade,
	cycle_number integer not null check (cycle_number > 0),
	amount bigint not null check (amount > 0),
	bank_account text not null,
	bank_name text not null,
	status text not null default 'pending' check (status in ('pending', 'processing', 'done', 'failed')),
	paystack_transfer_code text,
	paystack_transfer_reference text unique,
	marked_done_at timestamptz,
	marked_done_by uuid references public.profiles (id) on delete set null,
	created_at timestamptz not null default timezone('utc', now()),
	updated_at timestamptz not null default timezone('utc', now()),
	unique (group_id, cycle_number)
);

create index if not exists idx_payouts_status on public.payouts (status);
create index if not exists idx_payouts_user on public.payouts (user_id);
create index if not exists idx_payouts_group on public.payouts (group_id);

