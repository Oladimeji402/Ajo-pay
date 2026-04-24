-- Wallet anomaly checks for operations/support.

-- 1) Duplicate wallet ledger entries per idempotency key (should be zero).
select idempotency_key, count(*) as duplicate_count
from public.wallet_ledger
where idempotency_key is not null
group by idempotency_key
having count(*) > 1;

-- 2) Successful wallet funding with no matching wallet ledger credit.
select pr.reference, pr.user_id, pr.amount, pr.created_at
from public.payment_records pr
left join public.wallet_ledger wl
  on wl.reference = pr.reference and wl.direction = 'credit'
where pr.type = 'wallet_funding'
  and pr.status = 'success'
  and wl.id is null
order by pr.created_at desc;

-- 3) Wallet debit successful payment with no wallet ledger debit.
select pr.reference, pr.user_id, pr.amount, pr.type, pr.created_at
from public.payment_records pr
left join public.wallet_ledger wl
  on wl.reference = pr.reference and wl.direction = 'debit'
where pr.type in ('individual_savings', 'bulk_contribution')
  and pr.provider = 'wallet'
  and pr.status = 'success'
  and wl.id is null
order by pr.created_at desc;

-- 4) Stale pending payments above SLA (30 minutes).
select pr.reference, pr.user_id, pr.type, pr.status, pr.pending_reason, pr.reconcile_attempts, pr.created_at, pr.expires_at
from public.payment_records pr
where pr.status = 'pending'
  and coalesce(pr.expires_at, pr.created_at + interval '30 minutes') < timezone('utc', now())
order by pr.created_at asc;

-- 5) Successful bulk parent records with failed/pending child allocations.
select pr.reference,
       sum(case when pa.status = 'success' then 1 else 0 end) as success_allocations,
       sum(case when pa.status = 'failed' then 1 else 0 end) as failed_allocations,
       sum(case when pa.status = 'pending' then 1 else 0 end) as pending_allocations
from public.payment_records pr
join public.payment_allocations pa on pa.parent_reference = pr.reference
where pr.type = 'bulk_contribution'
  and pr.status = 'success'
group by pr.reference
having sum(case when pa.status in ('failed', 'pending') then 1 else 0 end) > 0
order by pr.reference desc;
