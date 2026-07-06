-- Add suspension_reason and account_locked fields to profiles table
alter table public.profiles
add column if not exists suspension_reason text,
add column if not exists suspended_at timestamptz,
add column if not exists suspended_by uuid references public.profiles(id),
add column if not exists account_locked boolean not null default false,
add column if not exists failed_login_attempts integer not null default 0,
add column if not exists locked_until timestamptz;

-- Index for locked accounts
create index if not exists idx_profiles_locked on public.profiles(account_locked) where account_locked = true;
create index if not exists idx_profiles_suspended_at on public.profiles(suspended_at) where suspended_at is not null;

comment on column public.profiles.suspension_reason is 'Reason provided by admin when suspending the account';
comment on column public.profiles.suspended_at is 'Timestamp when account was suspended';
comment on column public.profiles.suspended_by is 'Admin user who suspended the account';
comment on column public.profiles.account_locked is 'Whether account is temporarily locked due to failed login attempts';
comment on column public.profiles.failed_login_attempts is 'Count of consecutive failed login attempts';
comment on column public.profiles.locked_until is 'Timestamp until which the account remains locked';
