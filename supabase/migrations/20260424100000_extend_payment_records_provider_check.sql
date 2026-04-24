-- Allow wallet-originated payments in payment_records.
-- Bulk and individual savings wallet debits set provider='wallet'.

alter table public.payment_records
  drop constraint if exists payment_records_provider_check;

alter table public.payment_records
  add constraint payment_records_provider_check
  check (provider in ('paystack', 'wallet'));
