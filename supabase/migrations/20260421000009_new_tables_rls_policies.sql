-- RLS policies for all new tables introduced in the passbook transformation.
-- Follows the same pattern as existing policies: users see their own rows; admins see all.

-- ─── festive_periods ──────────────────────────────────────────────────────────
-- Public read (any logged-in user can browse available festive periods).
-- Only admins can insert, update, or delete.

alter table public.festive_periods enable row level security;

drop policy if exists festive_periods_select_authenticated on public.festive_periods;
create policy festive_periods_select_authenticated
on public.festive_periods
for select
to authenticated
using (true);

drop policy if exists festive_periods_insert_admin_only on public.festive_periods;
create policy festive_periods_insert_admin_only
on public.festive_periods
for insert
to authenticated
with check (public.is_admin(auth.uid()));

drop policy if exists festive_periods_update_admin_only on public.festive_periods;
create policy festive_periods_update_admin_only
on public.festive_periods
for update
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists festive_periods_delete_admin_only on public.festive_periods;
create policy festive_periods_delete_admin_only
on public.festive_periods
for delete
to authenticated
using (public.is_admin(auth.uid()));

-- ─── individual_savings_goals ─────────────────────────────────────────────────

alter table public.individual_savings_goals enable row level security;

drop policy if exists isg_select_own_or_admin on public.individual_savings_goals;
create policy isg_select_own_or_admin
on public.individual_savings_goals
for select
to authenticated
using (user_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists isg_insert_own on public.individual_savings_goals;
create policy isg_insert_own
on public.individual_savings_goals
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists isg_update_own_or_admin on public.individual_savings_goals;
create policy isg_update_own_or_admin
on public.individual_savings_goals
for update
to authenticated
using (user_id = auth.uid() or public.is_admin(auth.uid()))
with check (user_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists isg_delete_own_or_admin on public.individual_savings_goals;
create policy isg_delete_own_or_admin
on public.individual_savings_goals
for delete
to authenticated
using (user_id = auth.uid() or public.is_admin(auth.uid()));

-- ─── individual_savings_contributions ────────────────────────────────────────

alter table public.individual_savings_contributions enable row level security;

drop policy if exists isc_select_own_or_admin on public.individual_savings_contributions;
create policy isc_select_own_or_admin
on public.individual_savings_contributions
for select
to authenticated
using (user_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists isc_insert_own on public.individual_savings_contributions;
create policy isc_insert_own
on public.individual_savings_contributions
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists isc_update_own_or_admin on public.individual_savings_contributions;
create policy isc_update_own_or_admin
on public.individual_savings_contributions
for update
to authenticated
using (user_id = auth.uid() or public.is_admin(auth.uid()))
with check (user_id = auth.uid() or public.is_admin(auth.uid()));

-- ─── passbook_entries ─────────────────────────────────────────────────────────
-- Users read their own. Admins read all.
-- No direct user inserts — entries are written server-side only (service role).

alter table public.passbook_entries enable row level security;

drop policy if exists pb_select_own_or_admin on public.passbook_entries;
create policy pb_select_own_or_admin
on public.passbook_entries
for select
to authenticated
using (user_id = auth.uid() or public.is_admin(auth.uid()));

-- ─── payment_allocations ──────────────────────────────────────────────────────

alter table public.payment_allocations enable row level security;

drop policy if exists pa_select_own_or_admin on public.payment_allocations;
create policy pa_select_own_or_admin
on public.payment_allocations
for select
to authenticated
using (user_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists pa_insert_own on public.payment_allocations;
create policy pa_insert_own
on public.payment_allocations
for insert
to authenticated
with check (user_id = auth.uid());
