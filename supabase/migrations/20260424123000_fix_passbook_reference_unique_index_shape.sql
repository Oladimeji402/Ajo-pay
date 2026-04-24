begin;

-- Root-cause fix:
-- ON CONFLICT (reference) requires a matching non-partial unique/exclusion target.
-- Replace prior partial unique index with a full unique index on reference.

drop index if exists public.idx_passbook_entries_reference_unique;

create unique index if not exists idx_passbook_entries_reference_unique
  on public.passbook_entries (reference);

commit;
