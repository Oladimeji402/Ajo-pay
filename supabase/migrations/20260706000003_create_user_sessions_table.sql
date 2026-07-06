-- Create user_sessions table for tracking active user sessions
create table if not exists public.user_sessions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles(id) on delete cascade,
    session_token text,
    device_name text,
    device_type text,
    browser text,
    os text,
    ip_address inet,
    location_country text,
    location_city text,
    is_trusted boolean not null default false,
    last_activity timestamptz not null default timezone('utc', now()),
    revoked_at timestamptz,
    revoked_by uuid references public.profiles(id),
    revoke_reason text,
    created_at timestamptz not null default timezone('utc', now())
);

-- Indexes for efficient queries
create index if not exists idx_user_sessions_user_id on public.user_sessions(user_id);
create index if not exists idx_user_sessions_active on public.user_sessions(user_id, last_activity desc) where revoked_at is null;
create index if not exists idx_user_sessions_ip on public.user_sessions(ip_address);
create index if not exists idx_user_sessions_last_activity on public.user_sessions(last_activity desc);

-- RLS policies
alter table public.user_sessions enable row level security;

create policy "Users can view their own sessions"
    on public.user_sessions for select
    using (user_id = auth.uid());

create policy "Admins can view all sessions"
    on public.user_sessions for select
    using (
        exists (
            select 1 from public.profiles
            where profiles.id = auth.uid()
            and profiles.role = 'admin'
        )
    );

create policy "Users can insert their own sessions"
    on public.user_sessions for insert
    with check (user_id = auth.uid());

create policy "Users can update their own sessions"
    on public.user_sessions for update
    using (user_id = auth.uid());

create policy "Admins can update any sessions"
    on public.user_sessions for update
    using (
        exists (
            select 1 from public.profiles
            where profiles.id = auth.uid()
            and profiles.role = 'admin'
        )
    );

-- Function to revoke all user sessions (for force logout)
create or replace function public.revoke_all_user_sessions(
    target_user_id uuid,
    admin_user_id uuid default null,
    reason text default 'Admin action'
)
returns integer
language plpgsql
security definer
as $$
declare
    revoked_count integer;
begin
    -- Check if admin or self
    if auth.uid() != target_user_id then
        if not exists (
            select 1 from public.profiles
            where id = auth.uid()
            and role = 'admin'
        ) then
            raise exception 'Unauthorized';
        end if;
    end if;

    update public.user_sessions
    set 
        revoked_at = timezone('utc', now()),
        revoked_by = coalesce(admin_user_id, auth.uid()),
        revoke_reason = reason
    where user_id = target_user_id
    and revoked_at is null;

    get diagnostics revoked_count = row_count;
    
    return revoked_count;
end;
$$;

-- Function to get active sessions count
create or replace function public.get_active_sessions_count(target_user_id uuid)
returns integer
language sql
stable
as $$
    select count(*)::integer
    from public.user_sessions
    where user_id = target_user_id
    and revoked_at is null
    and last_activity > timezone('utc', now()) - interval '30 days';
$$;

-- Function to clean up old sessions (should be run periodically)
create or replace function public.cleanup_old_sessions()
returns integer
language plpgsql
as $$
declare
    deleted_count integer;
begin
    delete from public.user_sessions
    where last_activity < timezone('utc', now()) - interval '90 days'
    or (revoked_at is not null and revoked_at < timezone('utc', now()) - interval '30 days');
    
    get diagnostics deleted_count = row_count;
    
    return deleted_count;
end;
$$;

comment on table public.user_sessions is 'Tracks active user sessions for security monitoring and force logout capability';
comment on function public.revoke_all_user_sessions is 'Revokes all active sessions for a user (force logout)';
comment on function public.get_active_sessions_count is 'Returns count of active sessions for a user';
comment on function public.cleanup_old_sessions is 'Cleanup old and revoked sessions (run periodically)';
