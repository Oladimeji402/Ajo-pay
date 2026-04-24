import { NextResponse } from "next/server";
import { requireAdmin, serverErrorResponse } from "@/lib/api/auth";

export const revalidate = 60;

export async function GET() {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const [users, activeGoals, activeSchemes, successfulGoalContributions, successfulSchemeDeposits, allSchemes, allSchemeDeposits, allSchemePayouts] = await Promise.all([
      auth.supabase.from("profiles").select("id", { count: "exact", head: true }),
      auth.supabase.from("individual_savings_goals").select("id", { count: "exact", head: true }).eq("status", "active"),
      auth.supabase.from("savings_schemes").select("id", { count: "exact", head: true }).eq("status", "active"),
      auth.supabase.from("individual_savings_contributions").select("amount").eq("status", "success"),
      auth.supabase.from("savings_deposits").select("amount").eq("status", "success"),
      auth.supabase.from("savings_schemes").select("id").neq("status", "cancelled"),
      auth.supabase.from("savings_deposits").select("scheme_id, amount").eq("status", "success"),
      auth.supabase.from("passbook_payouts").select("scheme_id, amount"),
    ]);

    const volumeFromGoals = (successfulGoalContributions.data ?? []).reduce((sum, row) => sum + Number(row.amount ?? 0), 0);
    const volumeFromSchemes = (successfulSchemeDeposits.data ?? []).reduce((sum, row) => sum + Number(row.amount ?? 0), 0);
    const totalVolume = volumeFromGoals + volumeFromSchemes;

    const schemeIds = new Set((allSchemes.data ?? []).map((row) => row.id));
    const savedByScheme = new Map<string, number>();
    const paidByScheme = new Map<string, number>();

    for (const row of allSchemeDeposits.data ?? []) {
      savedByScheme.set(row.scheme_id, (savedByScheme.get(row.scheme_id) ?? 0) + Number(row.amount ?? 0));
    }
    for (const row of allSchemePayouts.data ?? []) {
      paidByScheme.set(row.scheme_id, (paidByScheme.get(row.scheme_id) ?? 0) + Number(row.amount ?? 0));
    }

    let pendingPayoutCount = 0;
    for (const schemeId of schemeIds) {
      const owed = (savedByScheme.get(schemeId) ?? 0) - (paidByScheme.get(schemeId) ?? 0);
      if (owed > 0) pendingPayoutCount += 1;
    }

    return NextResponse.json({
      data: {
        totalUsers: users.count ?? 0,
        activeGroups: (activeGoals.count ?? 0) + (activeSchemes.count ?? 0),
        pendingPayouts: pendingPayoutCount,
        totalVolume,
      },
    });
  } catch {
    return serverErrorResponse();
  }
}
