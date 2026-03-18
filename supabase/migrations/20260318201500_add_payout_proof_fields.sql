alter table public.payouts
    add column if not exists proof_url text,
    add column if not exists proof_note text,
    add column if not exists proof_uploaded_at timestamptz,
    add column if not exists proof_uploaded_by uuid references public.profiles (id) on delete set null;

create index if not exists idx_payouts_proof_uploaded_at
    on public.payouts (proof_uploaded_at desc);