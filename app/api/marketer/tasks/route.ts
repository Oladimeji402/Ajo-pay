import { NextResponse } from "next/server";
import { requireUser, serverErrorResponse } from "@/lib/api/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

async function requireActiveMarketer(userId: string) {
  const adminSupabase = createSupabaseAdminClient();
  const { data: marketer, error } = await adminSupabase
    .from("marketers")
    .select("id, status")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) return { error: NextResponse.json({ error: error.message }, { status: 400 }) };
  if (!marketer) return { error: NextResponse.json({ error: "Marketer application not found." }, { status: 404 }) };
  if (marketer.status !== "active") {
    return { error: NextResponse.json({ error: "Your account is not approved yet." }, { status: 403 }) };
  }
  return { marketer, adminSupabase };
}

export async function GET() {
  try {
    const auth = await requireUser();
    if (auth.error || !auth.user) return auth.error;

    const result = await requireActiveMarketer(auth.user.id);
    if (result.error) return result.error;

    const { data, error } = await result.adminSupabase
      .from("marketer_tasks")
      .select("id, title, description, status, due_at, created_at, updated_at")
      .eq("marketer_id", result.marketer.id)
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ data: data ?? [] });
  } catch (error) {
    return serverErrorResponse(error);
  }
}
