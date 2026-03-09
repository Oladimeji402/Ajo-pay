create table if not exists public.payment_records (
	id uuid primary key default gen_random_uuid(),
	contribution_id uuid references public.contributions (id) on delete set null,
	user_id uuid not null references public.profiles (id) on delete cascade,
	group_id uuid references public.groups (id) on delete set null,
	provider text not null default 'paystack' check (provider in ('paystack')),
	type text not null default 'contribution' check (type in ('contribution', 'payout')),
	amount bigint not null check (amount > 0),
	currency text not null default 'NGN',
	status text not null default 'pending' check (status in ('pending', 'success', 'failed')),
	reference text not null unique,
	provider_reference text unique,
	channel text,
	paid_at timestamptz,
	metadata jsonb not null default '{}'::jsonb,
	created_at timestamptz not null default timezone('utc', now()),
	updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_payment_records_user on public.payment_records (user_id);
create index if not exists idx_payment_records_group on public.payment_records (group_id);
create index if not exists idx_payment_records_status on public.payment_records (status);
create index if not exists idx_payment_records_provider_reference on public.payment_records (provider_reference);

