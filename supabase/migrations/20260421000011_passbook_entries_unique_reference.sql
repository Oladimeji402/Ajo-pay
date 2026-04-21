-- Prevent duplicate passbook ledger entries for the same payment reference.
-- This is the database-level guard against concurrent webhook calls.
-- Only applies to rows that actually have a reference (passbook_activation, contributions etc.)
-- Rows with a null reference are exempt (adjustments, manual entries).

create unique index if not exists idx_pb_entries_reference_unique
  on public.passbook_entries (reference)
  where reference is not null;
