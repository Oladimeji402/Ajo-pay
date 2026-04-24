begin;

-- Keep payment type/provider constraints aligned with runtime flows.
alter table if exists public.payment_records
  drop constraint if exists payment_records_type_check;

alter table if exists public.payment_records
  add constraint payment_records_type_check
  check (type in ('contribution', 'payout', 'passbook_activation', 'individual_savings', 'wallet_funding', 'bulk_contribution'));

alter table if exists public.payment_records
  drop constraint if exists payment_records_provider_check;

alter table if exists public.payment_records
  add constraint payment_records_provider_check
  check (provider in ('paystack', 'wallet'));

alter table if exists public.payment_records
  add column if not exists request_id text,
  add column if not exists reconcile_attempts integer not null default 0,
  add column if not exists last_reconciled_at timestamptz,
  add column if not exists pending_reason text;

create index if not exists idx_payment_records_request_id
  on public.payment_records (request_id);

create index if not exists idx_payment_records_pending_reconcile
  on public.payment_records (status, expires_at, last_reconciled_at);

-- Prevent stale legacy logic from mutating wallet_balance.
drop trigger if exists sync_contribution_totals on public.contributions;

create or replace function public.refresh_user_contribution_totals(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles p
  set total_contributed = coalesce((
      select sum(c.amount)
      from public.contributions c
      where c.user_id = target_user_id
        and c.status = 'success'
    ), 0),
    updated_at = timezone('utc', now())
  where p.id = target_user_id;
end;
$$;

create trigger sync_contribution_totals
after insert or update or delete on public.contributions
for each row
execute function public.handle_contribution_totals_sync();

-- Immutable wallet ledger for traceability.
create table if not exists public.wallet_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  direction text not null check (direction in ('credit', 'debit')),
  amount bigint not null check (amount > 0),
  balance_before bigint not null check (balance_before >= 0),
  balance_after bigint not null check (balance_after >= 0),
  reason text not null,
  payment_record_id uuid references public.payment_records (id) on delete set null,
  reference text,
  idempotency_key text,
  actor_type text not null default 'system' check (actor_type in ('system', 'admin', 'user')),
  actor_id uuid references public.profiles (id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_wallet_ledger_user_created
  on public.wallet_ledger (user_id, created_at desc);
create index if not exists idx_wallet_ledger_reference
  on public.wallet_ledger (reference);
create unique index if not exists idx_wallet_ledger_idempotency_key
  on public.wallet_ledger (idempotency_key) where idempotency_key is not null;

alter table public.wallet_ledger enable row level security;

drop policy if exists wallet_ledger_select_own on public.wallet_ledger;
create policy wallet_ledger_select_own
on public.wallet_ledger
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists wallet_ledger_select_admin on public.wallet_ledger;
create policy wallet_ledger_select_admin
on public.wallet_ledger
for select
to authenticated
using (public.is_admin(auth.uid()));

drop policy if exists wallet_ledger_insert_service_role on public.wallet_ledger;
create policy wallet_ledger_insert_service_role
on public.wallet_ledger
for insert
to authenticated
with check (public.is_admin(auth.uid()));

-- Support/complaint tracking.
create table if not exists public.support_cases (
  id uuid primary key default gen_random_uuid(),
  case_number text not null unique,
  user_id uuid not null references public.profiles (id) on delete cascade,
  opened_by_admin_id uuid references public.profiles (id) on delete set null,
  owner_admin_id uuid references public.profiles (id) on delete set null,
  status text not null default 'open' check (status in ('open', 'investigating', 'resolved', 'closed')),
  severity text not null default 'medium' check (severity in ('low', 'medium', 'high', 'critical')),
  complaint_type text not null default 'payment',
  summary text not null default '',
  resolution_notes text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.support_case_events (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.support_cases (id) on delete cascade,
  event_type text not null,
  reference text,
  actor_type text not null default 'admin' check (actor_type in ('admin', 'system', 'user')),
  actor_id uuid references public.profiles (id) on delete set null,
  details_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_support_cases_user_created
  on public.support_cases (user_id, created_at desc);
create index if not exists idx_support_case_events_case_created
  on public.support_case_events (case_id, created_at desc);
create index if not exists idx_support_case_events_reference
  on public.support_case_events (reference);

alter table public.support_cases enable row level security;
alter table public.support_case_events enable row level security;

drop policy if exists support_cases_select_admin on public.support_cases;
create policy support_cases_select_admin
on public.support_cases
for select
to authenticated
using (public.is_admin(auth.uid()));

drop policy if exists support_cases_insert_admin on public.support_cases;
create policy support_cases_insert_admin
on public.support_cases
for insert
to authenticated
with check (public.is_admin(auth.uid()));

drop policy if exists support_cases_update_admin on public.support_cases;
create policy support_cases_update_admin
on public.support_cases
for update
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists support_case_events_select_admin on public.support_case_events;
create policy support_case_events_select_admin
on public.support_case_events
for select
to authenticated
using (public.is_admin(auth.uid()));

drop policy if exists support_case_events_insert_admin on public.support_case_events;
create policy support_case_events_insert_admin
on public.support_case_events
for insert
to authenticated
with check (public.is_admin(auth.uid()));

-- Atomic wallet funding finalization.
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
  v_before bigint;
  v_after bigint;
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

commit;
