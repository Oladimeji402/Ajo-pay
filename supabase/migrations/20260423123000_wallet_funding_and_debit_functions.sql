-- Wallet mode: users fund wallet first, then spend wallet into savings.
-- No withdrawal function is exposed.

begin;

alter table if exists public.payment_records
  drop constraint if exists payment_records_type_check;

alter table if exists public.payment_records
  add constraint payment_records_type_check
  check (type in ('payout', 'passbook_activation', 'individual_savings', 'wallet_funding'));

create or replace function public.credit_wallet_balance(p_user_id uuid, p_amount bigint)
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
  set wallet_balance = coalesce(wallet_balance, 0) + p_amount,
      updated_at = timezone('utc', now())
  where id = p_user_id;

  return found;
end;
$$;

create or replace function public.debit_wallet_balance(p_user_id uuid, p_amount bigint)
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
  set wallet_balance = wallet_balance - p_amount,
      updated_at = timezone('utc', now())
  where id = p_user_id
    and wallet_balance >= p_amount;

  return found;
end;
$$;

comment on column public.profiles.wallet_balance is
'Spendable wallet balance funded by the user. Can be used only for savings payments, not withdrawal.';

commit;
