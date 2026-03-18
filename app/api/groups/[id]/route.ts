import { NextResponse } from "next/server";
import { badRequestResponse, requireAdmin, requireUser, serverErrorResponse } from "@/lib/api/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { logAdminAction } from "@/lib/admin-audit";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  try {
    const auth = await requireUser();
    if (auth.error) return auth.error;
    const { id } = await context.params;

    const { data: group, error: groupError } = await auth.supabase
      .from("groups")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (groupError) return badRequestResponse(groupError.message);
    if (!group) return NextResponse.json({ error: "Group not found" }, { status: 404 });

    const { data: members, error: membersError } = await auth.supabase
      .from("group_members")
      .select("*")
      .eq("group_id", id)
      .order("position", { ascending: true });

    if (membersError) return badRequestResponse(membersError.message);

    const memberUserIds = (members ?? []).map((member) => member.user_id).filter(Boolean);
    let profileById = new Map<string, { id: string; name: string | null; email: string | null; phone: string | null }>();

    if (memberUserIds.length > 0) {
      const adminSupabase = createSupabaseAdminClient();
      const { data: profiles, error: profilesError } = await adminSupabase
        .from("profiles")
        .select("id, name, email, phone")
        .in("id", memberUserIds);

      if (profilesError) {
        return serverErrorResponse(profilesError);
      }

      profileById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
    }

    const membersWithProfiles = (members ?? []).map((member) => ({
      ...member,
      profiles: profileById.get(member.user_id) ?? null,
    }));

    return NextResponse.json({ data: { ...group, members: membersWithProfiles } });
  } catch {
    return serverErrorResponse();
  }
}

export async function PATCH(request: Request, context: Context) {
  try {
    const auth = await requireAdmin();
    if (auth.error || !auth.user) return auth.error;
    const { id } = await context.params;

    const body = await request.json();
    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (body.name !== undefined) updates.name = String(body.name);
    if (body.category !== undefined) updates.category = body.category ? String(body.category) : null;
    if (body.contributionAmount !== undefined) updates.contribution_amount = Number(body.contributionAmount);
    if (body.frequency !== undefined) updates.frequency = String(body.frequency).toLowerCase();
    if (body.maxMembers !== undefined) updates.max_members = Number(body.maxMembers);
    if (body.totalCycles !== undefined) updates.total_cycles = Number(body.totalCycles);
    if (body.startDate !== undefined) updates.start_date = body.startDate ? String(body.startDate) : null;
    if (body.status !== undefined) updates.status = String(body.status).toLowerCase();
    if (body.color !== undefined) updates.color = String(body.color);

    const { data: beforeGroup, error: beforeGroupError } = await auth.supabase
      .from("groups")
      .select("id, name, category, contribution_amount, frequency, max_members, total_cycles, start_date, status, color")
      .eq("id", id)
      .maybeSingle();

    if (beforeGroupError) return badRequestResponse(beforeGroupError.message);
    if (!beforeGroup) return NextResponse.json({ error: "Group not found" }, { status: 404 });

    const { data, error } = await auth.supabase.from("groups").update(updates).eq("id", id).select("*").single();
    if (error) return badRequestResponse(error.message);

    await logAdminAction({
      adminId: auth.user.id,
      action: "group_updated",
      targetType: "group",
      targetId: id,
      before: beforeGroup as unknown as Record<string, unknown>,
      after: {
        id: data.id,
        name: data.name,
        category: data.category,
        contribution_amount: data.contribution_amount,
        frequency: data.frequency,
        max_members: data.max_members,
        total_cycles: data.total_cycles,
        start_date: data.start_date,
        status: data.status,
        color: data.color,
      },
      metadata: {
        updatedFields: Object.keys(updates).filter((key) => key !== "updated_at"),
      },
    });

    return NextResponse.json({ data });
  } catch {
    return serverErrorResponse();
  }
}
