create or replace function public.join_group_member(p_group_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    target_group public.groups%rowtype;
    existing_member public.group_members%rowtype;
    inserted_member public.group_members%rowtype;
    current_count integer;
begin
    if auth.uid() is null then
        return jsonb_build_object(
            'ok', false,
            'code', 'unauthorized',
            'message', 'Unauthorized'
        );
    end if;

    select *
    into target_group
    from public.groups
    where id = p_group_id
    for update;

    if not found then
        return jsonb_build_object(
            'ok', false,
            'code', 'group_not_found',
            'message', 'Group not found.'
        );
    end if;

    select *
    into existing_member
    from public.group_members
    where group_id = p_group_id
        and user_id = auth.uid();

    if found then
        return jsonb_build_object(
            'ok', false,
            'code', 'already_member',
            'message', 'User is already a member of this group.'
        );
    end if;

    select count(*)
    into current_count
    from public.group_members
    where group_id = p_group_id;

    if current_count >= target_group.max_members then
        return jsonb_build_object(
            'ok', false,
            'code', 'group_full',
            'message', 'Group has reached maximum member capacity.'
        );
    end if;

    insert into public.group_members (
        group_id,
        user_id,
        position,
        contribution_status,
        payout_status
    )
    values (
        p_group_id,
        auth.uid(),
        current_count + 1,
        'pending',
        'upcoming'
    )
    returning *
    into inserted_member;

    return jsonb_build_object(
        'ok', true,
        'member', row_to_json(inserted_member),
        'group', jsonb_build_object(
            'id', target_group.id,
            'name', target_group.name,
            'category', target_group.category
        )
    );
end;
$$;

grant execute on function public.join_group_member(uuid) to authenticated;

create or replace function public.leave_group_member(p_group_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    removed_member public.group_members%rowtype;
begin
    if auth.uid() is null then
        return jsonb_build_object(
            'ok', false,
            'code', 'unauthorized',
            'message', 'Unauthorized'
        );
    end if;

    perform 1
    from public.groups
    where id = p_group_id
    for update;

    if not found then
        return jsonb_build_object(
            'ok', false,
            'code', 'group_not_found',
            'message', 'Group not found.'
        );
    end if;

    select *
    into removed_member
    from public.group_members
    where group_id = p_group_id
        and user_id = auth.uid()
    for update;

    if not found then
        return jsonb_build_object(
            'ok', false,
            'code', 'not_member',
            'message', 'You are not a member of this group.'
        );
    end if;

    delete from public.group_members
    where id = removed_member.id;

    update public.group_members
    set position = position - 1
    where group_id = p_group_id
        and position > removed_member.position;

    return jsonb_build_object(
        'ok', true,
        'removedPosition', removed_member.position
    );
end;
$$;

grant execute on function public.leave_group_member(uuid) to authenticated;
