-- Change payment_records.amount from bigint to numeric to support kobo
-- This allows us to store exact amounts like ₦996.50 instead of rounding to ₦996

alter table public.payment_records 
  alter column amount type numeric(12,2) using amount::numeric(12,2);

-- Keep the check constraint but update it to work with numeric
alter table public.payment_records 
  drop constraint if exists payment_records_amount_check;

alter table public.payment_records 
  add constraint payment_records_amount_check check (amount > 0);

commit;
