import { NextResponse } from "next/server";
import { badRequestResponse, requireUser, serverErrorResponse } from "@/lib/api/auth";
import { appendGroupMemberJoinToGoogleSheet } from "@/lib/google-sheets-sync";

type Context = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: Context) {
  try {
    const auth = await requireUser();
    if (auth.error || !auth.user) return auth.error;
    const { id: groupId } = await context.params;
    const { data: rpcResult, error } = await auth.supabase.rpc("join_group_member", {
      p_group_id: groupId,
    });

    if (error) return serverErrorResponse(error);

    const result = rpcResult as {
      ok?: boolean;
      code?: string;
      message?: string;
      member?: {
        position?: number;
        [key: string]: unknown;
      };
      group?: {
        name?: string;
        category?: string | null;
      };
    } | null;

    if (!result?.ok) {
      if (result?.code === "group_not_found") {
        return NextResponse.json({ error: result.message ?? "Group not found" }, { status: 404 });
      }

      return badRequestResponse(result?.message ?? "Unable to join this group.");
    }

    const data = result.member;
    const position = Number(result.member?.position ?? 0);

    void appendGroupMemberJoinToGoogleSheet({
      groupId,
      groupName: result.group?.name ?? "",
      groupCategory: result.group?.category ?? "",
      userId: auth.user.id,
      userName: auth.user.user_metadata?.name ?? "",
      userEmail: auth.user.email ?? "",
      position,
      joinedAt: new Date().toISOString(),
    }).catch(() => {
      // Non-blocking integration.
    });

    return NextResponse.json({ data }, { status: 201 });
  } catch {
    return serverErrorResponse();
  }
}
