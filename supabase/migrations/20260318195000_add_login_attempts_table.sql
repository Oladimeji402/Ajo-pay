create table if not exists public.login_attempts (
    id uuid primary key default gen_random_uuid(),
    email text not null,
    ip text not null,
    succeeded boolean not null default false,
    user_agent text,
    attempted_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_login_attempts_email_ip_attempted_at
    on public.login_attempts (email, ip, attempted_at desc);

create index if not exists idx_login_attempts_attempted_at
    on public.login_attempts (attempted_at desc);

alter table public.login_attempts enable row level security;
