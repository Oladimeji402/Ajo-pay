import { NextResponse } from "next/server";
import { requireUser, serverErrorResponse } from "@/lib/api/auth";

type Context = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: Context) {
  try {
    const auth = await requireUser();
    if (auth.error || !auth.user) return auth.error;
    const { id: groupId } = await context.params;

    const { error, count } = await auth.supabase
      .from("group_members")
      .delete({ count: "exact" })
      .eq("group_id", groupId)
      .eq("user_id", auth.user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if ((count ?? 0) === 0) {
      return NextResponse.json({ error: "You are not a member of this group." }, { status: 404 });
    }

    const { data: group } = await auth.supabase
      .from("groups")
      .select("name")
      .eq("id", groupId)
      .maybeSingle();

    await auth.supabase
      .from("notifications")
      .insert({
        user_id: auth.user.id,
        type: "group_leave",
        title: "You left a group",
        body: `You left ${group?.name ?? "your group"}. You can rejoin later if space is still available.`,
      });

    return NextResponse.json({ success: true });
  } catch {
    return serverErrorResponse();
  }
}
