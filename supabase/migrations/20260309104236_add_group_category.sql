-- Add check constraint for group category values
alter table public.groups
  add constraint groups_category_check
  check (category in ('ajo', 'school', 'mosque', 'church'));

-- Default existing NULL categories to 'ajo'
update public.groups set category = 'ajo' where category is null;

-- Make category NOT NULL with default
alter table public.groups
  alter column category set default 'ajo',
  alter column category set not null;

-- Index for filtering by category
create index if not exists idx_groups_category on public.groups (category);
