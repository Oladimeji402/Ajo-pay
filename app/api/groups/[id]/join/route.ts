import { NextResponse } from "next/server";
import { badRequestResponse, requireUser, serverErrorResponse } from "@/lib/api/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type Context = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: Context) {
  try {
    const auth = await requireUser();
    if (auth.error || !auth.user) return auth.error;
    const { id: groupId } = await context.params;
    const adminSupabase = createSupabaseAdminClient();

    const { data: membership } = await adminSupabase
      .from("group_members")
      .select("id")
      .eq("group_id", groupId)
      .eq("user_id", auth.user.id)
      .maybeSingle();

    if (membership) {
      return badRequestResponse("User is already a member of this group.");
    }

    const { data: group, error: groupError } = await auth.supabase
      .from("groups")
      .select("id, max_members")
      .eq("id", groupId)
      .maybeSingle();

    if (groupError || !group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    const { count, error: countError } = await adminSupabase
      .from("group_members")
      .select("id", { count: "exact", head: true })
      .eq("group_id", groupId);

    if (countError) return badRequestResponse(countError.message);
    if ((count ?? 0) >= group.max_members) {
      return badRequestResponse("Group has reached maximum member capacity.");
    }

    const position = (count ?? 0) + 1;
    const { data, error } = await adminSupabase
      .from("group_members")
      .insert({
        group_id: groupId,
        user_id: auth.user.id,
        position,
        contribution_status: "pending",
        payout_status: "upcoming",
      })
      .select("*")
      .single();

    if (error) return badRequestResponse(error.message);
    return NextResponse.json({ data }, { status: 201 });
  } catch {
    return serverErrorResponse();
  }
}
