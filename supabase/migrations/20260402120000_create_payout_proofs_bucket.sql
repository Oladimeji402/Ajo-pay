-- Create the storage bucket for payout proof documents
-- Bucket is PRIVATE — direct browser access is blocked, files are served via signed URLs only
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'payout-proofs',
  'payout-proofs',
  false,       -- private: no public URL access
  5242880,     -- 5 MB
  '{image/jpeg,image/png,application/pdf}'
)
on conflict (id) do update
  set public = false,
      file_size_limit = 5242880,
      allowed_mime_types = '{image/jpeg,image/png,application/pdf}';

-- Drop old policies before recreating (idempotent)
drop policy if exists "Admins can upload payout proofs" on storage.objects;
drop policy if exists "Payout proofs are publicly readable" on storage.objects;
drop policy if exists "Admins can view payout proofs" on storage.objects;

-- Only authenticated admins can upload
create policy "Admins can upload payout proofs"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'payout-proofs'
    and exists (
      select 1 from public.profiles
      where id = auth.uid()
        and role = 'admin'
        and status = 'active'
    )
  );

-- Only authenticated admins can read (signed URL generation also uses service role, not this policy directly)
create policy "Admins can view payout proofs"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'payout-proofs'
    and exists (
      select 1 from public.profiles
      where id = auth.uid()
        and role = 'admin'
        and status = 'active'
    )
  );
