begin;

-- ============================================================================
-- SETTLEMENT TRACKING
-- Track when MoniCredit settles money to our business account
-- ============================================================================

create table if not exists public.settlements (
  id uuid primary key default gen_random_uuid(),
  
  -- Settlement identification
  settlement_reference text unique not null,
  monicredit_batch_id text,
  
  -- Amount and timing
  amount bigint not null check (amount > 0),
  settlement_date date not null,
  
  -- Status tracking
  status text not null default 'pending' check (status in ('pending', 'completed', 'failed', 'reversed')),
  
  -- Bank details
  bank_account_number text,
  bank_account_name text,
  bank_name text,
  
  -- Additional info
  metadata jsonb default '{}'::jsonb,
  notes text,
  
  -- Reconciliation
  reconciled boolean default false,
  reconciled_at timestamptz,
  reconciled_by uuid references auth.users(id),
  
  -- Timestamps
  created_at timestamptz default timezone('utc', now()) not null,
  updated_at timestamptz default timezone('utc', now()) not null
);

-- Index for fast lookups
create index if not exists idx_settlements_status on public.settlements(status);
create index if not exists idx_settlements_date on public.settlements(settlement_date desc);
create index if not exists idx_settlements_reconciled on public.settlements(reconciled, settlement_date desc);
create index if not exists idx_settlements_reference on public.settlements(settlement_reference);

-- Updated at trigger
create or replace function public.handle_settlements_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create trigger set_settlements_updated_at
  before update on public.settlements
  for each row
  execute function public.handle_settlements_updated_at();

-- ============================================================================
-- FINANCIAL CALCULATIONS
-- Calculate system obligations, settled amounts, and liquidity
-- ============================================================================

-- Calculate total system obligations (what we owe users)
create or replace function public.calculate_total_obligations()
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total_wallet_balance bigint;
  v_total_savings_balance bigint;
  v_total_group_balance bigint;
  v_total_obligations bigint;
begin
  -- Total in all user wallets
  select coalesce(sum(wallet_balance), 0)
  into v_total_wallet_balance
  from public.profiles;
  
  -- Total in individual savings (not yet paid out)
  select coalesce(sum(amount), 0)
  into v_total_savings_balance
  from public.individual_savings_contributions
  where status = 'success';
  
  -- Total in general savings (not yet paid out)
  select coalesce(sum(amount), 0)
  into v_total_group_balance
  from public.savings_deposits
  where status = 'success';
  
  v_total_obligations := v_total_wallet_balance + v_total_savings_balance + v_total_group_balance;
  
  return v_total_obligations;
end;
$$;

-- Calculate total settled amount (what MoniCredit has paid us)
create or replace function public.calculate_total_settled()
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total bigint;
begin
  select coalesce(sum(amount), 0)
  into v_total
  from public.settlements
  where status = 'completed';
  
  return v_total;
end;
$$;

-- Calculate total paid out to users
create or replace function public.calculate_total_payouts()
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total bigint;
begin
  -- Assuming you have a payouts table (if not, this will need adjustment)
  -- For now, calculate from payment_records with type 'payout' or 'withdrawal'
  select coalesce(sum(amount), 0)
  into v_total
  from public.payment_records
  where type in ('payout', 'withdrawal', 'withdrawal_disbursement')
    and status = 'success';
  
  return v_total;
end;
$$;

-- Calculate available balance for payouts
create or replace function public.calculate_available_balance()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_obligations bigint;
  v_settled bigint;
  v_paid_out bigint;
  v_available bigint;
  v_deficit bigint;
begin
  v_obligations := public.calculate_total_obligations();
  v_settled := public.calculate_total_settled();
  v_paid_out := public.calculate_total_payouts();
  
  -- Available = What we received - What we already paid out
  v_available := v_settled - v_paid_out;
  
  -- Deficit = What we owe - What we have available
  v_deficit := greatest(0, v_obligations - v_available);
  
  return jsonb_build_object(
    'total_obligations', v_obligations,
    'total_settled', v_settled,
    'total_paid_out', v_paid_out,
    'available_balance', v_available,
    'deficit', v_deficit,
    'is_solvent', v_available >= v_obligations,
    'calculated_at', timezone('utc', now())
  );
end;
$$;

-- ============================================================================
-- SETTLEMENT MANAGEMENT FUNCTIONS
-- ============================================================================

-- Record a new settlement from MoniCredit
create or replace function public.record_settlement(
  p_settlement_reference text,
  p_amount bigint,
  p_settlement_date date,
  p_bank_account_number text default null,
  p_bank_account_name text default null,
  p_bank_name text default null,
  p_monicredit_batch_id text default null,
  p_metadata jsonb default '{}'::jsonb,
  p_notes text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_settlement_id uuid;
begin
  if p_amount <= 0 then
    return jsonb_build_object('ok', false, 'code', 'invalid_amount', 'message', 'Amount must be greater than 0');
  end if;
  
  if p_settlement_reference is null or trim(p_settlement_reference) = '' then
    return jsonb_build_object('ok', false, 'code', 'missing_reference', 'message', 'Settlement reference is required');
  end if;
  
  -- Check for duplicate
  if exists (select 1 from public.settlements where settlement_reference = p_settlement_reference) then
    return jsonb_build_object('ok', false, 'code', 'duplicate', 'message', 'Settlement already recorded');
  end if;
  
  insert into public.settlements (
    settlement_reference,
    monicredit_batch_id,
    amount,
    settlement_date,
    status,
    bank_account_number,
    bank_account_name,
    bank_name,
    metadata,
    notes
  )
  values (
    p_settlement_reference,
    p_monicredit_batch_id,
    p_amount,
    p_settlement_date,
    'pending',
    p_bank_account_number,
    p_bank_account_name,
    p_bank_name,
    p_metadata,
    p_notes
  )
  returning id into v_settlement_id;
  
  return jsonb_build_object(
    'ok', true,
    'code', 'success',
    'settlement_id', v_settlement_id,
    'message', 'Settlement recorded successfully'
  );
end;
$$;

-- Mark settlement as completed (money received)
create or replace function public.complete_settlement(
  p_settlement_id uuid,
  p_admin_user_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_current_status text;
begin
  select status into v_current_status
  from public.settlements
  where id = p_settlement_id;
  
  if not found then
    return jsonb_build_object('ok', false, 'code', 'not_found', 'message', 'Settlement not found');
  end if;
  
  if v_current_status = 'completed' then
    return jsonb_build_object('ok', false, 'code', 'already_completed', 'message', 'Settlement already completed');
  end if;
  
  update public.settlements
  set status = 'completed',
      reconciled = true,
      reconciled_at = timezone('utc', now()),
      reconciled_by = p_admin_user_id
  where id = p_settlement_id;
  
  return jsonb_build_object(
    'ok', true,
    'code', 'success',
    'message', 'Settlement marked as completed'
  );
end;
$$;

-- Get settlement summary for admin dashboard
create or replace function public.get_settlement_summary(
  p_start_date date default null,
  p_end_date date default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total_pending bigint;
  v_total_completed bigint;
  v_total_failed bigint;
  v_count_pending integer;
  v_count_completed integer;
  v_count_failed integer;
  v_last_settlement_date date;
  v_liquidity jsonb;
begin
  -- Get totals by status
  select
    coalesce(sum(case when status = 'pending' then amount else 0 end), 0),
    coalesce(sum(case when status = 'completed' then amount else 0 end), 0),
    coalesce(sum(case when status = 'failed' then amount else 0 end), 0),
    count(case when status = 'pending' then 1 end),
    count(case when status = 'completed' then 1 end),
    count(case when status = 'failed' then 1 end)
  into v_total_pending, v_total_completed, v_total_failed,
       v_count_pending, v_count_completed, v_count_failed
  from public.settlements
  where (p_start_date is null or settlement_date >= p_start_date)
    and (p_end_date is null or settlement_date <= p_end_date);
  
  -- Get last settlement date
  select max(settlement_date)
  into v_last_settlement_date
  from public.settlements
  where status = 'completed';
  
  -- Get liquidity status
  v_liquidity := public.calculate_available_balance();
  
  return jsonb_build_object(
    'settlements', jsonb_build_object(
      'pending', jsonb_build_object('count', v_count_pending, 'amount', v_total_pending),
      'completed', jsonb_build_object('count', v_count_completed, 'amount', v_total_completed),
      'failed', jsonb_build_object('count', v_count_failed, 'amount', v_total_failed),
      'last_settlement_date', v_last_settlement_date
    ),
    'liquidity', v_liquidity,
    'generated_at', timezone('utc', now())
  );
end;
$$;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

alter table public.settlements enable row level security;

-- Only admins can view settlements
create policy "Admins can view all settlements"
  on public.settlements
  for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'admin'
    )
  );

-- Only admins can insert settlements
create policy "Admins can insert settlements"
  on public.settlements
  for insert
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'admin'
    )
  );

-- Only admins can update settlements
create policy "Admins can update settlements"
  on public.settlements
  for update
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'admin'
    )
  );

commit;
