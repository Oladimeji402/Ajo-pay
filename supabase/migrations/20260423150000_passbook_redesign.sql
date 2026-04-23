-- Passbook redesign: accumulative per-period contributions + minimum amounts.
-- Run this in the Supabase SQL editor.
-- NOTE:
-- passbook_payouts now lives in 20260423150000_general_savings.sql using scheme_id.
-- This file must NOT create/index passbook_payouts by goal_id to avoid schema conflicts.

begin;

-- 1. Drop the one-slot-per-period constraint so multiple payments can accumulate in the same period.
alter table if exists public.individual_savings_contributions
  drop constraint if exists individual_savings_contributions_goal_id_period_index_key;

-- 2. Add admin-configurable minimum contribution amount per goal (default 500 NGN).
alter table if exists public.individual_savings_goals
  add column if not exists minimum_amount bigint not null default 500 check (minimum_amount > 0);

commit;
