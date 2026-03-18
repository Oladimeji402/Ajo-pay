-- ─────────────────────────────────────────────────────────────────────────────
-- Phase 4: Atomic group join + contributions uniqueness
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Unique constraint on contributions(user_id, group_id, cycle_number)
--    Prevents a user from having duplicate contribution rows for the same cycle.
ALTER TABLE public.contributions
    ADD CONSTRAINT contributions_user_group_cycle_unique
    UNIQUE (user_id, group_id, cycle_number);

-- 2. Atomic join_group RPC
--    Replaces the client-side count-then-insert pattern that is susceptible to
--    race conditions when multiple users join a group concurrently.
--    The function acquires a row-level lock on the group before counting members,
--    so capacity checks and the insert are guaranteed to be atomic.
CREATE OR REPLACE FUNCTION public.join_group(p_group_id uuid, p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_group    record;
    v_count    int;
    v_position int;
    v_member   record;
BEGIN
    -- Lock this group row to serialise concurrent joins.
    SELECT id, name, category, max_members
      INTO v_group
      FROM public.groups
     WHERE id = p_group_id
       FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'GROUP_NOT_FOUND';
    END IF;

    -- Reject duplicate membership.
    IF EXISTS (
        SELECT 1
          FROM public.group_members
         WHERE group_id = p_group_id
           AND user_id  = p_user_id
    ) THEN
        RAISE EXCEPTION 'ALREADY_MEMBER';
    END IF;

    -- Count current members under the lock so no other transaction can
    -- insert between the count and the insert below.
    SELECT COUNT(*)
      INTO v_count
      FROM public.group_members
     WHERE group_id = p_group_id;

    IF v_count >= v_group.max_members THEN
        RAISE EXCEPTION 'GROUP_FULL';
    END IF;

    v_position := v_count + 1;

    INSERT INTO public.group_members (
        group_id, user_id, position, contribution_status, payout_status
    )
    VALUES (
        p_group_id, p_user_id, v_position, 'pending', 'upcoming'
    )
    RETURNING * INTO v_member;

    RETURN jsonb_build_object(
        'id',                  v_member.id,
        'group_id',            v_member.group_id,
        'user_id',             v_member.user_id,
        'position',            v_member.position,
        'contribution_status', v_member.contribution_status,
        'payout_status',       v_member.payout_status,
        'joined_at',           v_member.joined_at
    );
END;
$$;

-- Restrict direct invocation: only the service-role key (used by admin
-- clients in Route Handlers) may call this function.
REVOKE EXECUTE ON FUNCTION public.join_group(uuid, uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.join_group(uuid, uuid) TO service_role;
