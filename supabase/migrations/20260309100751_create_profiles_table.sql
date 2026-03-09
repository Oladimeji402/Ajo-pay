create extension if not exists pgcrypto;

create table if not exists public.profiles (
	id uuid primary key references auth.users (id) on delete cascade,
	name text not null default '',
	email text not null unique,
	phone text,
	avatar_url text,
	bank_account text,
	bank_name text,
	wallet_balance bigint not null default 0 check (wallet_balance >= 0),
	total_contributed bigint not null default 0 check (total_contributed >= 0),
	total_received bigint not null default 0 check (total_received >= 0),
	savings_streak integer not null default 0 check (savings_streak >= 0),
	kyc_level smallint not null default 1 check (kyc_level between 1 and 3),
	status text not null default 'active' check (status in ('active', 'suspended')),
	role text not null default 'user' check (role in ('user', 'admin')),
	created_at timestamptz not null default timezone('utc', now()),
	updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_profiles_status on public.profiles (status);
create index if not exists idx_profiles_role on public.profiles (role);

comment on column public.profiles.wallet_balance is
'Derived value equal to the user total successful contributions across all groups.';

