-- Extend payment_records.type CHECK to support the new passbook_activation
-- and individual_savings payment types without breaking the existing constraint.

alter table public.payment_records
  drop constraint if exists payment_records_type_check;

alter table public.payment_records
  add constraint payment_records_type_check
  check (type in ('contribution', 'payout', 'passbook_activation', 'individual_savings', 'bulk_contribution'));
