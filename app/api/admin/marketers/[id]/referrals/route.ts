import { NextResponse } from "next/server";
import { badRequestResponse, requireAdmin, serverErrorResponse } from "@/lib/api/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type Context = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: Context) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const { id } = await context.params;
    const url = new URL(request.url);
    const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
    const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get("pageSize") ?? 20)));
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const adminSupabase = createSupabaseAdminClient();

    const { data: marketer, error: marketerError } = await adminSupabase
      .from("marketers")
      .select("id, name")
      .eq("id", id)
      .maybeSingle();

    if (marketerError) return badRequestResponse(marketerError.message);
    if (!marketer) return NextResponse.json({ error: "Marketer not found." }, { status: 404 });

    const { data, error, count } = await adminSupabase
      .from("profiles")
      .select("id, name, email, phone, status, referral_code_used, created_at", { count: "exact" })
      .eq("marketer_id", id)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) return badRequestResponse(error.message);

    return NextResponse.json({
      data,
      pagination: {
        page,
        pageSize,
        total: count ?? 0,
        totalPages: Math.ceil((count ?? 0) / pageSize),
      },
    });
  } catch (error) {
    return serverErrorResponse(error);
  }
}
