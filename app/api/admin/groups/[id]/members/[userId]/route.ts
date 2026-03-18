import { NextResponse } from "next/server";
import { badRequestResponse, requireAdmin, serverErrorResponse } from "@/lib/api/auth";
import { logAdminAction } from "@/lib/admin-audit";

type Context = { params: Promise<{ id: string; userId: string }> };

export async function DELETE(_request: Request, context: Context) {
  try {
    const auth = await requireAdmin();
    if (auth.error || !auth.user) return auth.error;

    const { id: groupId, userId } = await context.params;

    const { data: beforeMember, error: beforeError } = await auth.supabase
      .from("group_members")
      .select("id, group_id, user_id, position, contribution_status, payout_status")
      .eq("group_id", groupId)
      .eq("user_id", userId)
      .maybeSingle();

    if (beforeError) return badRequestResponse(beforeError.message);
    if (!beforeMember) return NextResponse.json({ error: "Member not found in this group." }, { status: 404 });

    const { error, count } = await auth.supabase
      .from("group_members")
      .delete({ count: "exact" })
      .eq("group_id", groupId)
      .eq("user_id", userId);

    if (error) return badRequestResponse(error.message);
    if ((count ?? 0) === 0) return NextResponse.json({ error: "Member not found in this group." }, { status: 404 });

    const { data: group } = await auth.supabase.from("groups").select("name").eq("id", groupId).maybeSingle();

    await auth.supabase.from("notifications").insert({
      user_id: userId,
      type: "group_member_removed",
      title: "Removed from group",
      body: `An admin removed you from ${group?.name ?? "a group"}.`,
      metadata: { groupId },
    });

    await logAdminAction({
      adminId: auth.user.id,
      action: "group_member_removed",
      targetType: "group_member",
      targetId: beforeMember.id,
      before: beforeMember as unknown as Record<string, unknown>,
      after: {},
      metadata: { groupId, userId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return serverErrorResponse(error);
  }
}
