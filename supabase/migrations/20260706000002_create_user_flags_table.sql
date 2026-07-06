-- Create user_flags table for tagging users with risk/trust levels and other flags
create table if not exists public.user_flags (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles(id) on delete cascade,
    flag_type text not null check (flag_type in (
        'high_value',
        'high_risk', 
        'vip',
        'suspicious',
        'verified',
        'trusted',
        'watch_list',
        'fraud_alert',
        'compliance_review',
        'kyc_pending',
        'custom'
    )),
    flag_label text,
    reason text,
    added_by uuid not null references public.profiles(id),
    removed_by uuid references public.profiles(id),
    removed_at timestamptz,
    metadata jsonb default '{}'::jsonb,
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now())
);

-- Indexes for efficient queries
create index if not exists idx_user_flags_user_id on public.user_flags(user_id);
create index if not exists idx_user_flags_flag_type on public.user_flags(flag_type);
create index if not exists idx_user_flags_active on public.user_flags(user_id, flag_type) where removed_at is null;
create index if not exists idx_user_flags_added_by on public.user_flags(added_by);

-- RLS policies (admin-only access)
alter table public.user_flags enable row level security;

create policy "Admins can view all user flags"
    on public.user_flags for select
    using (
        exists (
            select 1 from public.profiles
            where profiles.id = auth.uid()
            and profiles.role = 'admin'
        )
    );

create policy "Admins can insert user flags"
    on public.user_flags for insert
    with check (
        exists (
            select 1 from public.profiles
            where profiles.id = auth.uid()
            and profiles.role = 'admin'
        )
        and added_by = auth.uid()
    );

create policy "Admins can update user flags"
    on public.user_flags for update
    using (
        exists (
            select 1 from public.profiles
            where profiles.id = auth.uid()
            and profiles.role = 'admin'
        )
    );

-- Function to get active flags for a user
create or replace function public.get_active_flags(target_user_id uuid)
returns table (
    flag_type text,
    flag_label text,
    reason text,
    created_at timestamptz
)
language sql
stable
as $$
    select flag_type, flag_label, reason, created_at
    from public.user_flags
    where user_id = target_user_id
    and removed_at is null
    order by created_at desc;
$$;

comment on table public.user_flags is 'Tags and flags for user accounts (risk level, trust level, special status)';
comment on function public.get_active_flags is 'Returns all active (non-removed) flags for a user';
