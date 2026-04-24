begin;

-- Make wallet RPCs resilient even if conflict-target constraints drift.
-- Avoid ON CONFLICT(...) inference for passbook_entries and contribution slot writes.

create or replace function public.pay_individual_savings_from_wallet(
  p_user_id uuid,
  p_goal_id uuid,
  p_amount bigint,
  p_period_label text,
  p_period_index integer,
  p_period_date date,
  p_reference text,
  p_request_id text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_before bigint;
  v_after bigint;
  v_payment_id uuid;
  v_now timestamptz := timezone('utc', now());
begin
  if p_amount <= 0 then
    return jsonb_build_object('ok', false, 'code', 'invalid_amount');
  end if;

  select wallet_balance into v_before
  from public.profiles
  where id = p_user_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'code', 'user_not_found');
  end if;

  if v_before < p_amount then
    return jsonb_build_object('ok', false, 'code', 'insufficient_balance');
  end if;

  v_after := v_before - p_amount;

  update public.profiles
  set wallet_balance = v_after,
      updated_at = v_now
  where id = p_user_id;

  insert into public.payment_records (
    user_id, group_id, contribution_id, provider, type, amount, currency, status,
    reference, paid_at, metadata, request_id, pending_reason, expires_at
  )
  values (
    p_user_id, null, null, 'wallet', 'individual_savings', p_amount, 'NGN', 'success',
    p_reference, v_now,
    jsonb_build_object('goalId', p_goal_id, 'periodIndex', p_period_index, 'fundedFromWallet', true),
    p_request_id, null, null
  )
  returning id into v_payment_id;

  update public.individual_savings_contributions
  set amount = p_amount,
      period_label = p_period_label,
      period_date = p_period_date,
      status = 'success',
      paystack_reference = p_reference,
      payment_record_id = v_payment_id,
      paid_at = v_now,
      updated_at = v_now
  where goal_id = p_goal_id
    and period_index = p_period_index;

  if not found then
    insert into public.individual_savings_contributions (
      goal_id, user_id, amount, period_label, period_index, period_date, status,
      paystack_reference, payment_record_id, paid_at
    )
    values (
      p_goal_id, p_user_id, p_amount, p_period_label, p_period_index, p_period_date, 'success',
      p_reference, v_payment_id, v_now
    );
  end if;

  insert into public.passbook_entries (
    user_id, entry_type, source_id, source_table, goal_id, amount, direction, status,
    reference, period_label, description, happened_at
  )
  select
    p_user_id, 'individual_savings', v_payment_id, 'individual_savings_contributions', p_goal_id, p_amount, 'debit', 'success',
    p_reference, p_period_label, 'Wallet payment to individual savings', v_now
  where not exists (
    select 1 from public.passbook_entries pbe where pbe.reference = p_reference
  );

  insert into public.wallet_ledger (
    user_id, direction, amount, balance_before, balance_after, reason, payment_record_id,
    reference, idempotency_key, actor_type, metadata
  )
  values (
    p_user_id, 'debit', p_amount, v_before, v_after, 'individual_savings_payment', v_payment_id,
    p_reference, 'wallet_spend:' || p_reference, 'system',
    jsonb_build_object('goalId', p_goal_id, 'periodIndex', p_period_index, 'requestId', p_request_id)
  );

  return jsonb_build_object('ok', true, 'code', 'success', 'payment_record_id', v_payment_id);
end;
$$;

create or replace function public.pay_general_savings_from_wallet(
  p_user_id uuid,
  p_scheme_id uuid,
  p_amount bigint,
  p_reference text,
  p_request_id text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_before bigint;
  v_after bigint;
  v_payment_id uuid;
  v_now timestamptz := timezone('utc', now());
begin
  if p_amount <= 0 then
    return jsonb_build_object('ok', false, 'code', 'invalid_amount');
  end if;

  select wallet_balance into v_before
  from public.profiles
  where id = p_user_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'code', 'user_not_found');
  end if;

  if v_before < p_amount then
    return jsonb_build_object('ok', false, 'code', 'insufficient_balance');
  end if;

  v_after := v_before - p_amount;

  update public.profiles
  set wallet_balance = v_after,
      updated_at = v_now
  where id = p_user_id;

  insert into public.payment_records (
    user_id, provider, type, amount, currency, status, reference, paid_at, metadata, request_id
  )
  values (
    p_user_id, 'wallet', 'individual_savings', p_amount, 'NGN', 'success', p_reference, v_now,
    jsonb_build_object('schemeId', p_scheme_id, 'fundedFromWallet', true, 'mode', 'general_savings'),
    p_request_id
  )
  returning id into v_payment_id;

  insert into public.savings_deposits (
    scheme_id, user_id, amount, reference, status, paid_at
  )
  values (
    p_scheme_id, p_user_id, p_amount, p_reference, 'success', v_now
  );

  insert into public.passbook_entries (
    user_id, entry_type, source_id, source_table, amount, direction, status, reference, description, happened_at
  )
  select
    p_user_id, 'individual_savings', v_payment_id, 'savings_deposits', p_amount, 'debit', 'success',
    p_reference, 'Wallet payment to general savings', v_now
  where not exists (
    select 1 from public.passbook_entries pbe where pbe.reference = p_reference
  );

  insert into public.wallet_ledger (
    user_id, direction, amount, balance_before, balance_after, reason, payment_record_id,
    reference, idempotency_key, actor_type, metadata
  )
  values (
    p_user_id, 'debit', p_amount, v_before, v_after, 'general_savings_payment', v_payment_id,
    p_reference, 'wallet_spend:' || p_reference, 'system',
    jsonb_build_object('schemeId', p_scheme_id, 'requestId', p_request_id)
  );

  return jsonb_build_object('ok', true, 'code', 'success', 'payment_record_id', v_payment_id);
end;
$$;

create or replace function public.pay_bulk_from_wallet(
  p_user_id uuid,
  p_total_amount bigint,
  p_reference text,
  p_allocations jsonb,
  p_request_id text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_before bigint;
  v_after bigint;
  v_payment_id uuid;
  v_now timestamptz := timezone('utc', now());
  v_alloc jsonb;
begin
  if p_total_amount <= 0 then
    return jsonb_build_object('ok', false, 'code', 'invalid_amount');
  end if;

  if jsonb_typeof(p_allocations) <> 'array' or jsonb_array_length(p_allocations) = 0 then
    return jsonb_build_object('ok', false, 'code', 'invalid_allocations');
  end if;

  select wallet_balance into v_before
  from public.profiles
  where id = p_user_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'code', 'user_not_found');
  end if;

  if v_before < p_total_amount then
    return jsonb_build_object('ok', false, 'code', 'insufficient_balance');
  end if;

  v_after := v_before - p_total_amount;

  update public.profiles
  set wallet_balance = v_after,
      updated_at = v_now
  where id = p_user_id;

  insert into public.payment_records (
    user_id, provider, type, amount, currency, status, reference, paid_at, metadata, request_id
  )
  values (
    p_user_id, 'wallet', 'bulk_contribution', p_total_amount, 'NGN', 'success', p_reference, v_now,
    jsonb_build_object('type', 'wallet_split', 'allocations', p_allocations),
    p_request_id
  )
  returning id into v_payment_id;

  for v_alloc in select value from jsonb_array_elements(p_allocations)
  loop
    update public.individual_savings_contributions
    set amount = (v_alloc ->> 'amount')::bigint,
        period_label = v_alloc ->> 'periodLabel',
        period_date = (v_alloc ->> 'periodDate')::date,
        status = 'success',
        paystack_reference = v_alloc ->> 'reference',
        payment_record_id = v_payment_id,
        paid_at = v_now,
        updated_at = v_now
    where goal_id = (v_alloc ->> 'goalId')::uuid
      and period_index = (v_alloc ->> 'periodIndex')::integer;

    if not found then
      insert into public.individual_savings_contributions (
        goal_id, user_id, amount, period_label, period_index, period_date, status,
        paystack_reference, payment_record_id, paid_at
      )
      values (
        (v_alloc ->> 'goalId')::uuid,
        p_user_id,
        (v_alloc ->> 'amount')::bigint,
        v_alloc ->> 'periodLabel',
        (v_alloc ->> 'periodIndex')::integer,
        (v_alloc ->> 'periodDate')::date,
        'success',
        v_alloc ->> 'reference',
        v_payment_id,
        v_now
      );
    end if;

    insert into public.passbook_entries (
      user_id, entry_type, source_id, source_table, goal_id, amount, direction, status,
      reference, period_label, description, happened_at
    )
    select
      p_user_id, 'individual_savings', v_payment_id, 'individual_savings_contributions',
      (v_alloc ->> 'goalId')::uuid, (v_alloc ->> 'amount')::bigint, 'debit', 'success',
      v_alloc ->> 'reference', v_alloc ->> 'periodLabel', 'Wallet split payment to savings goal', v_now
    where not exists (
      select 1 from public.passbook_entries pbe where pbe.reference = (v_alloc ->> 'reference')
    );
  end loop;

  insert into public.wallet_ledger (
    user_id, direction, amount, balance_before, balance_after, reason, payment_record_id,
    reference, idempotency_key, actor_type, metadata
  )
  values (
    p_user_id, 'debit', p_total_amount, v_before, v_after, 'bulk_payment', v_payment_id,
    p_reference, 'wallet_spend:' || p_reference, 'system',
    jsonb_build_object('allocationCount', jsonb_array_length(p_allocations), 'requestId', p_request_id)
  );

  return jsonb_build_object('ok', true, 'code', 'success', 'payment_record_id', v_payment_id);
end;
$$;

commit;
