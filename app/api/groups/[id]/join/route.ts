import { NextResponse } from "next/server";
import { badRequestResponse, requireUser, serverErrorResponse } from "@/lib/api/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { appendGroupMemberJoinToGoogleSheet } from "@/lib/google-sheets-sync";

type Context = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: Context) {
  try {
    const auth = await requireUser();
    if (auth.error || !auth.user) return auth.error;
    const { id: groupId } = await context.params;
    const adminSupabase = createSupabaseAdminClient();

    // Atomic join: a Postgres function acquires a row-level lock on the group,
    // counts current members, checks capacity, and inserts — all in one transaction.
    const { data: member, error: rpcError } = await adminSupabase
      .rpc("join_group", { p_group_id: groupId, p_user_id: auth.user.id });

    if (rpcError) {
      const msg = rpcError.message ?? "";
      if (msg.includes("ALREADY_MEMBER")) return badRequestResponse("User is already a member of this group.");
      if (msg.includes("GROUP_NOT_FOUND")) return NextResponse.json({ error: "Group not found" }, { status: 404 });
      if (msg.includes("GROUP_FULL")) return badRequestResponse("Group has reached maximum member capacity.");
      return serverErrorResponse(rpcError);
    }

    const { data: group } = await auth.supabase
      .from("groups")
      .select("name, category")
      .eq("id", groupId)
      .maybeSingle();

    void appendGroupMemberJoinToGoogleSheet({
      groupId,
      groupName: group?.name ?? "",
      groupCategory: group?.category ?? "",
      userId: auth.user.id,
      userName: auth.user.user_metadata?.name ?? "",
      userEmail: auth.user.email ?? "",
      position: (member as { position: number }).position,
      joinedAt: new Date().toISOString(),
    }).catch(() => {});

    return NextResponse.json({ data: member }, { status: 201 });
  } catch {
    return serverErrorResponse();
  }
}
