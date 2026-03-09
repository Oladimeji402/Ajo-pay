create or replace function public.is_admin(user_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
	select exists (
		select 1
		from public.profiles p
		where p.id = user_uuid
			and p.role = 'admin'
			and p.status = 'active'
	);
$$;

grant execute on function public.is_admin(uuid) to authenticated;

alter table public.profiles enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.contributions enable row level security;
alter table public.payment_records enable row level security;
alter table public.payouts enable row level security;

drop policy if exists profiles_select_own_or_admin on public.profiles;
create policy profiles_select_own_or_admin
on public.profiles
for select
to authenticated
using (id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists profiles_update_own_or_admin on public.profiles;
create policy profiles_update_own_or_admin
on public.profiles
for update
to authenticated
using (id = auth.uid() or public.is_admin(auth.uid()))
with check (
	(id = auth.uid() and role = 'user')
	or public.is_admin(auth.uid())
);

drop policy if exists groups_select_authenticated on public.groups;
create policy groups_select_authenticated
on public.groups
for select
to authenticated
using (true);

drop policy if exists groups_insert_admin_only on public.groups;
create policy groups_insert_admin_only
on public.groups
for insert
to authenticated
with check (public.is_admin(auth.uid()));

drop policy if exists groups_update_admin_only on public.groups;
create policy groups_update_admin_only
on public.groups
for update
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists groups_delete_admin_only on public.groups;
create policy groups_delete_admin_only
on public.groups
for delete
to authenticated
using (public.is_admin(auth.uid()));

drop policy if exists group_members_select_group_members_or_admin on public.group_members;
create policy group_members_select_group_members_or_admin
on public.group_members
for select
to authenticated
using (
	public.is_admin(auth.uid())
	or exists (
		select 1
		from public.group_members gm
		where gm.group_id = group_members.group_id
			and gm.user_id = auth.uid()
	)
);

drop policy if exists group_members_insert_self_or_admin on public.group_members;
create policy group_members_insert_self_or_admin
on public.group_members
for insert
to authenticated
with check (
	public.is_admin(auth.uid())
	or user_id = auth.uid()
);

drop policy if exists group_members_delete_self_or_admin on public.group_members;
create policy group_members_delete_self_or_admin
on public.group_members
for delete
to authenticated
using (
	public.is_admin(auth.uid())
	or user_id = auth.uid()
);

drop policy if exists contributions_select_own_or_admin on public.contributions;
create policy contributions_select_own_or_admin
on public.contributions
for select
to authenticated
using (user_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists contributions_insert_own on public.contributions;
create policy contributions_insert_own
on public.contributions
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists payment_records_select_own_or_admin on public.payment_records;
create policy payment_records_select_own_or_admin
on public.payment_records
for select
to authenticated
using (user_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists payouts_select_own_or_admin on public.payouts;
create policy payouts_select_own_or_admin
on public.payouts
for select
to authenticated
using (user_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists payouts_update_admin_only on public.payouts;
create policy payouts_update_admin_only
on public.payouts
for update
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

