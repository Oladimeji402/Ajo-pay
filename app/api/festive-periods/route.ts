import { NextResponse } from "next/server";
import { badRequestResponse, requireUser, serverErrorResponse } from "@/lib/api/auth";

export async function GET() {
  try {
    const auth = await requireUser();
    if (auth.error || !auth.user) return auth.error!;

    const { data, error } = await auth.supabase
      .from("festive_periods")
      .select("id, name, slug, description, category, emoji, color, target_date, savings_start_date, savings_end_date, suggested_frequency, year")
      .eq("is_active", true)
      .order("target_date", { ascending: true });

    if (error) return badRequestResponse(error.message);
    return NextResponse.json({ data });
  } catch {
    return serverErrorResponse();
  }
}
