import { NextResponse } from "next/server";
import { badRequestResponse, requireUser, serverErrorResponse } from "@/lib/api/auth";

export async function GET(request: Request) {
  try {
    const auth = await requireUser();
    if (auth.error || !auth.user) return auth.error;

    const url = new URL(request.url);
    const limit = Math.min(Math.max(Number(url.searchParams.get("limit") ?? 25), 1), 100);
    const unreadOnly = url.searchParams.get("unreadOnly") === "true";

    let query = auth.supabase
      .from("notifications")
      .select("id, user_id, type, title, body, read, metadata, created_at")
      .eq("user_id", auth.user.id)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (unreadOnly) {
      query = query.eq("read", false);
    }

    const { data, error } = await query;
    if (error) return badRequestResponse(error.message);

    const { count, error: countError } = await auth.supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", auth.user.id)
      .eq("read", false);

    if (countError) return badRequestResponse(countError.message);

    return NextResponse.json({
      data: data ?? [],
      unreadCount: count ?? 0,
    });
  } catch (error) {
    return serverErrorResponse(error);
  }
}

export async function PATCH() {
  try {
    const auth = await requireUser();
    if (auth.error || !auth.user) return auth.error;

    const { error } = await auth.supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", auth.user.id)
      .eq("read", false);

    if (error) return badRequestResponse(error.message);
    return NextResponse.json({ success: true });
  } catch (error) {
    return serverErrorResponse(error);
  }
}