import { NextResponse } from "next/server";
import { requireUser, serverErrorResponse } from "@/lib/api/auth";

type Context = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: Context) {
  try {
    const auth = await requireUser();
    if (auth.error || !auth.user) return auth.error;
    const { id: groupId } = await context.params;

    const { error } = await auth.supabase
      .from("group_members")
      .delete()
      .eq("group_id", groupId)
      .eq("user_id", auth.user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return serverErrorResponse();
  }
}
