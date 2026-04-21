-- Festive period templates managed by admin.
-- Users create individual savings goals based on these templates.
-- Each row is a well-known Nigerian occasion admin can toggle active/inactive per year.

create table if not exists public.festive_periods (
  id                   uuid        primary key default gen_random_uuid(),
  name                 text        not null,
  slug                 text        not null unique,
  description          text        not null default '',
  category             text        not null check (category in ('religious', 'national', 'cultural', 'personal')),
  emoji                text        not null default '',
  color                text        not null default '#3B82F6',
  target_date          date        not null,
  savings_start_date   date        not null,
  savings_end_date     date        not null,
  suggested_frequency  text        not null default 'monthly' check (suggested_frequency in ('daily', 'weekly', 'monthly')),
  is_active            boolean     not null default true,
  year                 integer     not null default extract(year from current_date),
  created_at           timestamptz not null default timezone('utc', now()),
  updated_at           timestamptz not null default timezone('utc', now())
);

create index if not exists idx_festive_periods_is_active on public.festive_periods (is_active);
create index if not exists idx_festive_periods_year      on public.festive_periods (year);
create index if not exists idx_festive_periods_category  on public.festive_periods (category);

drop trigger if exists set_festive_periods_updated_at on public.festive_periods;
create trigger set_festive_periods_updated_at
before update on public.festive_periods
for each row
execute function public.update_updated_at_column();

comment on table public.festive_periods is
  'Admin-managed Nigerian festive occasion templates. Users create individual savings goals from these.';
