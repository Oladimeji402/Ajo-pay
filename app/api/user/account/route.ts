import { NextResponse } from "next/server";
import { requireUser, serverErrorResponse } from "@/lib/api/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function DELETE() {
  try {
    const auth = await requireUser();
    if (auth.error || !auth.user) return auth.error;

    const adminSupabase = createSupabaseAdminClient();
    const { error } = await adminSupabase.auth.admin.deleteUser(auth.user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return serverErrorResponse(error);
  }
}