import { NextResponse } from "next/server";
import { requireAdmin, serverErrorResponse } from "@/lib/api/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const url = new URL(request.url);
    const page = Math.max(Number(url.searchParams.get("page") ?? 1), 1);
    const pageSize = Math.min(Math.max(Number(url.searchParams.get("pageSize") ?? 25), 1), 100);
    const email = (url.searchParams.get("email") ?? "").trim().toLowerCase();
    const outcome = (url.searchParams.get("outcome") ?? "all").trim().toLowerCase();
    const windowMinutes = Math.min(Math.max(Number(url.searchParams.get("windowMinutes") ?? 60), 5), 10080);
    const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString();

    const adminClient = createSupabaseAdminClient();
    let query = adminClient
      .from("login_attempts")
      .select("id, email, ip, succeeded, user_agent, attempted_at", { count: "exact" })
      .gte("attempted_at", windowStart)
      .order("attempted_at", { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);

    if (email) query = query.ilike("email", `%${email}%`);
    if (outcome === "failed") query = query.eq("succeeded", false);
    if (outcome === "succeeded") query = query.eq("succeeded", true);

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      data: data ?? [],
      pagination: {
        page,
        pageSize,
        total: count ?? 0,
      },
      windowMinutes,
    });
  } catch (error) {
    return serverErrorResponse(error);
  }
}