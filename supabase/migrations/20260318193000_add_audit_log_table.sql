create table if not exists public.audit_log (
    id uuid primary key default gen_random_uuid(),
    admin_id uuid not null references auth.users (id) on delete cascade,
    action text not null,
    target_type text not null,
    target_id text not null,
    before_val jsonb not null default '{}'::jsonb,
    after_val jsonb not null default '{}'::jsonb,
    metadata jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_audit_log_created_at on public.audit_log (created_at desc);
create index if not exists idx_audit_log_admin_id on public.audit_log (admin_id);
create index if not exists idx_audit_log_target on public.audit_log (target_type, target_id);

alter table public.audit_log enable row level security;

drop policy if exists audit_log_select_admin on public.audit_log;
create policy audit_log_select_admin
on public.audit_log
for select
to authenticated
using (public.is_admin(auth.uid()));

drop policy if exists audit_log_insert_admin on public.audit_log;
create policy audit_log_insert_admin
on public.audit_log
for insert
to authenticated
with check (public.is_admin(auth.uid()));
