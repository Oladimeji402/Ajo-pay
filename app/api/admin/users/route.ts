import { NextResponse } from "next/server";
import { badRequestResponse, requireAdmin, serverErrorResponse } from "@/lib/api/auth";

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const url = new URL(request.url);
    const search = url.searchParams.get("search");
    const status = url.searchParams.get("status");
    const page = Math.max(Number(url.searchParams.get("page") ?? 1), 1);
    const pageSize = Math.min(Math.max(Number(url.searchParams.get("pageSize") ?? 20), 1), 100);

    let query = auth.supabase
      .from("profiles")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);

    if (status) query = query.eq("status", status);
    if (search) query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);

    const { data, error, count } = await query;
    if (error) return badRequestResponse(error.message);

    return NextResponse.json({
      data,
      pagination: {
        page,
        pageSize,
        total: count ?? 0,
      },
    });
  } catch {
    return serverErrorResponse();
  }
}
