-- Fix settlement tracking functions to use numeric instead of bigint
-- This aligns with the wallet_balance decimal migration

begin;

-- Drop existing functions first (can't change return type without dropping)
drop function if exists public.calculate_total_obligations();
drop function if exists public.calculate_total_settled();
drop function if exists public.calculate_total_payouts();
drop function if exists public.calculate_liquidity();

-- 1. Create calculate_total_obligations with numeric
create function public.calculate_total_obligations()
returns numeric(12,2)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total_wallet_balance numeric(12,2);
  v_total_savings_balance numeric(12,2);
  v_total_group_balance numeric(12,2);
  v_total_obligations numeric(12,2);
begin
  -- Total in all user wallets (now in naira with decimals)
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

-- 2. Create calculate_total_settled with numeric
create function public.calculate_total_settled()
returns numeric(12,2)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total_settled numeric(12,2);
begin
  select coalesce(sum(amount), 0)
  into v_total_settled
  from public.settlements
  where status = 'completed';
  
  return v_total_settled;
end;
$$;

-- 3. Create calculate_total_payouts with numeric
create function public.calculate_total_payouts()
returns numeric(12,2)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total_payouts numeric(12,2);
begin
  select coalesce(sum(amount), 0)
  into v_total_payouts
  from public.payouts
  where status = 'done';
  
  return v_total_payouts;
end;
$$;

-- 4. Create calculate_liquidity with numeric
create function public.calculate_liquidity()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_obligations numeric(12,2);
  v_settled numeric(12,2);
  v_paid_out numeric(12,2);
  v_available numeric(12,2);
  v_is_solvent boolean;
  v_deficit numeric(12,2);
begin
  v_obligations := public.calculate_total_obligations();
  v_settled := public.calculate_total_settled();
  v_paid_out := public.calculate_total_payouts();
  
  v_available := v_settled - v_paid_out;
  v_is_solvent := v_available >= v_obligations;
  v_deficit := case when v_is_solvent then 0 else v_obligations - v_available end;
  
  return jsonb_build_object(
    'total_obligations', v_obligations,
    'total_settled', v_settled,
    'total_paid_out', v_paid_out,
    'available_balance', v_available,
    'is_solvent', v_is_solvent,
    'deficit', v_deficit
  );
end;
$$;

-- 5. Update settlements table amount column to numeric if not already
alter table public.settlements 
  alter column amount type numeric(12,2) using amount::numeric(12,2);

-- 6. Update payouts table amount column to numeric if not already  
alter table public.payouts 
  alter column amount type numeric(12,2) using amount::numeric(12,2);

-- 7. Update savings_deposits table amount column to numeric if not already
alter table public.savings_deposits 
  alter column amount type numeric(12,2) using amount::numeric(12,2);

-- 8. Update individual_savings_contributions amount column to numeric if not already
alter table public.individual_savings_contributions 
  alter column amount type numeric(12,2) using amount::numeric(12,2);

commit;
