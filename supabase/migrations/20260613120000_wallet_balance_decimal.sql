-- Change wallet_balance from bigint to numeric to support kobo (decimal places)
-- This allows us to store exact amounts like ₦498.25 instead of rounding to ₦498

-- 1. Change profiles.wallet_balance to numeric(12,2)
alter table public.profiles 
  alter column wallet_balance type numeric(12,2) using wallet_balance::numeric(12,2);

-- Update the check constraint to work with numeric
alter table public.profiles 
  drop constraint if exists profiles_wallet_balance_check;

alter table public.profiles 
  add constraint profiles_wallet_balance_check check (wallet_balance >= 0);

-- 2. Change wallet_ledger amount and balance fields to numeric(12,2)
alter table public.wallet_ledger 
  alter column amount type numeric(12,2) using amount::numeric(12,2);

alter table public.wallet_ledger 
  alter column balance_before type numeric(12,2) using balance_before::numeric(12,2);

alter table public.wallet_ledger 
  alter column balance_after type numeric(12,2) using balance_after::numeric(12,2);

-- 3. Update the finalize_wallet_funding function to work with numeric
create or replace function public.finalize_wallet_funding(
  p_reference text,
  p_provider_reference text default null,
  p_channel text default null,
  p_payload jsonb default '{}'::jsonb,
  p_request_id text default null
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payment public.payment_records%rowtype;
  v_before numeric(12,2);
  v_after numeric(12,2);
  v_metadata jsonb;
begin
  select *
  into v_payment
  from public.payment_records
  where reference = p_reference
    and type = 'wallet_funding'
  for update;

  if not found then
    return 'not_found';
  end if;

  if v_payment.status = 'success' then
    return 'already_success';
  end if;

  if v_payment.status <> 'pending' then
    return 'invalid_state';
  end if;

  select wallet_balance into v_before
  from public.profiles
  where id = v_payment.user_id
  for update;

  if v_before is null then
    return 'invalid_state';
  end if;

  v_after := v_before + coalesce(v_payment.amount, 0);

  update public.profiles
  set wallet_balance = v_after,
      updated_at = timezone('utc', now())
  where id = v_payment.user_id;

  v_metadata := coalesce(v_payment.metadata, '{}'::jsonb) || jsonb_build_object(
    'providerPayload', coalesce(p_payload, '{}'::jsonb),
    'finalizedAt', timezone('utc', now()),
    'requestId', p_request_id
  );

  update public.payment_records
  set status = 'success',
      provider_reference = coalesce(p_provider_reference, provider_reference, reference),
      channel = coalesce(p_channel, channel),
      paid_at = coalesce(paid_at, timezone('utc', now())),
      metadata = v_metadata,
      request_id = coalesce(p_request_id, request_id),
      pending_reason = null,
      last_reconciled_at = timezone('utc', now()),
      reconcile_attempts = coalesce(reconcile_attempts, 0) + 1
  where id = v_payment.id;

  insert into public.wallet_ledger (
    user_id, direction, amount, balance_before, balance_after, reason, payment_record_id,
    reference, idempotency_key, actor_type, actor_id, metadata
  )
  values (
    v_payment.user_id, 'credit', v_payment.amount, v_before, v_after, 'wallet_funding',
    v_payment.id, v_payment.reference, 'wallet_funding:' || v_payment.reference,
    'system', null, jsonb_build_object('provider_reference', p_provider_reference, 'channel', p_channel)
  )
  on conflict do nothing;

  return 'credited';
end;
$$;

-- 4. Update credit_wallet_balance function to work with numeric
create or replace function public.credit_wallet_balance(p_user_id uuid, p_amount numeric)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_amount <= 0 then
    return false;
  end if;

  update public.profiles
  set wallet_balance = wallet_balance + p_amount,
      updated_at = timezone('utc', now())
  where id = p_user_id;

  return found;
end;
$$;

-- 5. Update debit_wallet_balance function to work with numeric
create or replace function public.debit_wallet_balance(p_user_id uuid, p_amount numeric)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_current_balance numeric(12,2);
begin
  if p_amount <= 0 then
    return false;
  end if;

  select wallet_balance into v_current_balance
  from public.profiles
  where id = p_user_id
  for update;

  if not found or v_current_balance is null then
    return false;
  end if;

  if v_current_balance < p_amount then
    return false;
  end if;

  update public.profiles
  set wallet_balance = wallet_balance - p_amount,
      updated_at = timezone('utc', now())
  where id = p_user_id;

  return found;
end;
$$;

commit;
