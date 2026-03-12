alter table public.payouts
	add column if not exists scheduled_for date;

create index if not exists idx_payouts_scheduled_for on public.payouts (scheduled_for);
