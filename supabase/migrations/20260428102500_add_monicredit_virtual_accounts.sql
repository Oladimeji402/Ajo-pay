begin;

alter table if exists public.profiles
  add column if not exists virtual_account_number text,
  add column if not exists virtual_account_bank text,
  add column if not exists virtual_account_name text,
  add column if not exists monicredit_wallet_id text,
  add column if not exists monicredit_customer_id text,
  add column if not exists virtual_account_provisioned_at timestamptz,
  add column if not exists monicredit_last_synced_at timestamptz;

create index if not exists idx_profiles_virtual_account_number
  on public.profiles (virtual_account_number);

create index if not exists idx_profiles_monicredit_wallet_id
  on public.profiles (monicredit_wallet_id);

alter table if exists public.payment_records
  drop constraint if exists payment_records_provider_check;

alter table if exists public.payment_records
  add constraint payment_records_provider_check
  check (provider in ('paystack', 'wallet', 'monicredit'));

commit;
