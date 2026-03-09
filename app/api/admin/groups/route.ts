import { NextResponse } from "next/server";
import { badRequestResponse, requireAdmin, serverErrorResponse } from "@/lib/api/auth";

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const category = url.searchParams.get("category");
    const search = url.searchParams.get("search");

    let query = auth.supabase
      .from("groups")
      .select("*, group_members(count)")
      .order("created_at", { ascending: false });

    if (status) query = query.eq("status", status);
    if (category) query = query.eq("category", category);
    if (search) query = query.ilike("name", `%${search}%`);

    const { data, error } = await query;
    if (error) return badRequestResponse(error.message);

    return NextResponse.json({ data });
  } catch {
    return serverErrorResponse();
  }
}
