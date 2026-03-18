import { NextResponse } from "next/server";
import { requireUser, serverErrorResponse } from "@/lib/api/auth";

type Context = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: Context) {
  try {
    const auth = await requireUser();
    if (auth.error || !auth.user) return auth.error;
    const { id: groupId } = await context.params;

    const { data: rpcResult, error } = await auth.supabase.rpc("leave_group_member", {
      p_group_id: groupId,
    });

    if (error) {
      return serverErrorResponse(error);
    }

    const result = rpcResult as {
      ok?: boolean;
      code?: string;
      message?: string;
      removedPosition?: number;
    } | null;

    if (!result?.ok) {
      if (result?.code === "group_not_found") {
        return NextResponse.json({ error: result.message ?? "Group not found." }, { status: 404 });
      }

      if (result?.code === "not_member") {
        return NextResponse.json({ error: result.message ?? "You are not a member of this group." }, { status: 404 });
      }

      return NextResponse.json({ error: result?.message ?? "Unable to leave this group." }, { status: 400 });
    }

    return NextResponse.json({ success: true, removedPosition: result.removedPosition ?? null });
  } catch {
    return serverErrorResponse();
  }
}
