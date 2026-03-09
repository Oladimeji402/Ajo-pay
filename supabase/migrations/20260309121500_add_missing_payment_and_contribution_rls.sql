drop policy if exists contributions_update_own_or_admin on public.contributions;
create policy contributions_update_own_or_admin
on public.contributions
for update
to authenticated
using (user_id = auth.uid() or public.is_admin(auth.uid()))
with check (user_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists payment_records_insert_own_or_admin on public.payment_records;
create policy payment_records_insert_own_or_admin
on public.payment_records
for insert
to authenticated
with check (user_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists payment_records_update_own_or_admin on public.payment_records;
create policy payment_records_update_own_or_admin
on public.payment_records
for update
to authenticated
using (user_id = auth.uid() or public.is_admin(auth.uid()))
with check (user_id = auth.uid() or public.is_admin(auth.uid()));
