alter table public.contributions
  drop constraint if exists contributions_status_check;

alter table public.contributions
  add constraint contributions_status_check
  check (status in ('pending', 'success', 'failed', 'abandoned'));

alter table public.payment_records
  add column if not exists expires_at timestamptz;

update public.payment_records
set expires_at = created_at + interval '30 minutes'
where expires_at is null
  and status = 'pending';

alter table public.payment_records
  drop constraint if exists payment_records_status_check;

alter table public.payment_records
  add constraint payment_records_status_check
  check (status in ('pending', 'success', 'failed', 'abandoned'));

create index if not exists idx_payment_records_status_expires_at
  on public.payment_records (status, expires_at);
