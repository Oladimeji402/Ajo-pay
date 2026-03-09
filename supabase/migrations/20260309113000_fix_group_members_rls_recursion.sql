create or replace function public.is_group_member(group_uuid uuid, user_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select exists (
        select 1
        from public.group_members gm
        where gm.group_id = group_uuid
            and gm.user_id = user_uuid
    );
$$;

grant execute on function public.is_group_member(uuid, uuid) to authenticated;

drop policy if exists group_members_select_group_members_or_admin on public.group_members;
create policy group_members_select_group_members_or_admin
on public.group_members
for select
to authenticated
using (
    public.is_admin(auth.uid())
    or public.is_group_member(group_id, auth.uid())
);
