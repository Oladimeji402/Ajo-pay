-- Create admin_notes table for internal admin comments on user accounts
create table if not exists public.admin_notes (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles(id) on delete cascade,
    admin_id uuid not null references public.profiles(id) on delete cascade,
    note text not null,
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now())
);

-- Indexes for efficient queries
create index if not exists idx_admin_notes_user_id on public.admin_notes(user_id);
create index if not exists idx_admin_notes_admin_id on public.admin_notes(admin_id);
create index if not exists idx_admin_notes_created_at on public.admin_notes(created_at desc);

-- RLS policies (admin-only access)
alter table public.admin_notes enable row level security;

create policy "Admins can view all admin notes"
    on public.admin_notes for select
    using (
        exists (
            select 1 from public.profiles
            where profiles.id = auth.uid()
            and profiles.role = 'admin'
        )
    );

create policy "Admins can insert admin notes"
    on public.admin_notes for insert
    with check (
        exists (
            select 1 from public.profiles
            where profiles.id = auth.uid()
            and profiles.role = 'admin'
        )
        and admin_id = auth.uid()
    );

create policy "Admins can update their own notes"
    on public.admin_notes for update
    using (
        exists (
            select 1 from public.profiles
            where profiles.id = auth.uid()
            and profiles.role = 'admin'
        )
        and admin_id = auth.uid()
    );

create policy "Admins can delete their own notes"
    on public.admin_notes for delete
    using (
        exists (
            select 1 from public.profiles
            where profiles.id = auth.uid()
            and profiles.role = 'admin'
        )
        and admin_id = auth.uid()
    );

comment on table public.admin_notes is 'Internal admin notes and comments about users, not visible to users themselves';
