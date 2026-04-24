begin;

-- Ensure passbook_entries can safely use ON CONFLICT (reference).
-- If duplicates exist from older writes, keep the earliest row per reference
-- and null out later duplicates so the unique index can be created.
with duplicate_rows as (
  select
    id,
    reference,
    row_number() over (partition by reference order by created_at asc, id asc) as rn
  from public.passbook_entries
  where reference is not null
)
update public.passbook_entries p
set reference = null
from duplicate_rows d
where p.id = d.id
  and d.rn > 1;

create unique index if not exists idx_passbook_entries_reference_unique
  on public.passbook_entries (reference)
  where reference is not null;

commit;
