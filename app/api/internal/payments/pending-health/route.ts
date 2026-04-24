import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

function isAuthorized(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return process.env.NODE_ENV !== "production";
  const authorization = request.headers.get("authorization");
  return authorization === `Bearer ${cronSecret}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createSupabaseAdminClient();
    const thresholdIso = new Date(Date.now() - 30 * 60 * 1000).toISOString();

    const { count, error } = await supabase
      .from("payment_records")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending")
      .lte("created_at", thresholdIso);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      data: {
        stalePendingCount: count ?? 0,
        thresholdMinutes: 30,
        healthy: (count ?? 0) <= 5,
      },
    });
  } catch (error) {
    console.error("[payments/pending-health]", error);
    return NextResponse.json({ error: "Unable to compute pending health." }, { status: 500 });
  }
}
