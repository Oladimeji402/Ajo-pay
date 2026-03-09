import { NextResponse } from "next/server";
import { requireAdmin, serverErrorResponse } from "@/lib/api/auth";

export async function GET() {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const [users, groups, pendingPayouts, volume] = await Promise.all([
      auth.supabase.from("profiles").select("id", { count: "exact", head: true }),
      auth.supabase.from("groups").select("id", { count: "exact", head: true }).eq("status", "active"),
      auth.supabase.from("payouts").select("id", { count: "exact", head: true }).eq("status", "pending"),
      auth.supabase.from("payment_records").select("amount").eq("status", "success"),
    ]);

    const totalVolume = (volume.data ?? []).reduce((sum, row) => sum + Number(row.amount ?? 0), 0);

    return NextResponse.json({
      data: {
        totalUsers: users.count ?? 0,
        activeGroups: groups.count ?? 0,
        pendingPayouts: pendingPayouts.count ?? 0,
        totalVolume,
      },
    });
  } catch {
    return serverErrorResponse();
  }
}
