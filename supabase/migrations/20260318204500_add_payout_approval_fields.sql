alter table public.payouts
    add column if not exists approved_at timestamptz,
    add column if not exists approved_by uuid references public.profiles (id) on delete set null;

create index if not exists idx_payouts_approved_at
    on public.payouts (approved_at desc);