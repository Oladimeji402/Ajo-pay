import { NextResponse } from "next/server";
import { requireUser, serverErrorResponse } from "@/lib/api/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const auth = await requireUser();
    if (auth.error || !auth.user) return auth.error;

    const adminSupabase = createSupabaseAdminClient();
    const { data: marketer, error } = await adminSupabase
      .from("marketers")
      .select("id, name, email, phone, referral_code, status, rejection_reason, passport_path, created_at, reviewed_at")
      .eq("user_id", auth.user.id)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (!marketer) {
      return NextResponse.json({ error: "No marketer application found." }, { status: 404 });
    }

    let openTasks = 0;
    if (marketer.status === "active") {
      const { count } = await adminSupabase
        .from("marketer_tasks")
        .select("id", { count: "exact", head: true })
        .eq("marketer_id", marketer.id)
        .in("status", ["open", "in_progress"]);
      openTasks = count ?? 0;
    }

    return NextResponse.json({
      data: {
        ...marketer,
        open_tasks: openTasks,
      },
    });
  } catch (error) {
    return serverErrorResponse(error);
  }
}
