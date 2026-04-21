-- Add passbook activation fields to profiles.
-- passbook_activated: false until the user pays the one-time NGN 500 fee.
-- passbook_activated_at: timestamp of when the fee was confirmed by Paystack webhook.
-- passbook_reference: the Paystack reference of the activation payment for audit.

alter table public.profiles
  add column if not exists passbook_activated      boolean     not null default false,
  add column if not exists passbook_activated_at   timestamptz          default null,
  add column if not exists passbook_reference      text                 default null;

comment on column public.profiles.passbook_activated is
  'True only after the one-time NGN 500 passbook activation fee has been verified via Paystack webhook. Never set from the frontend.';

comment on column public.profiles.passbook_reference is
  'Paystack reference for the NGN 500 passbook activation payment.';
