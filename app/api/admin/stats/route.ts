import { NextResponse } from "next/server";
import { requireAdmin, serverErrorResponse } from "@/lib/api/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const revalidate = 60;

export async function GET() {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const adminSupabase = createSupabaseAdminClient();

    const [users, activeGoals, activeSchemes, successfulSavingsPayments, allSchemes, allSchemePayouts] = await Promise.all([
      adminSupabase.from("profiles").select("id", { count: "exact", head: true }),
      adminSupabase.from("individual_savings_goals").select("id", { count: "exact", head: true }).eq("status", "active"),
      adminSupabase.from("savings_schemes").select("id", { count: "exact", head: true }).eq("status", "active"),
      adminSupabase.from("payment_records").select("amount").in("type", ["individual_savings", "bulk_contribution"]).eq("status", "success"),
      adminSupabase.from("savings_schemes").select("id").neq("status", "cancelled"),
      adminSupabase.from("passbook_payouts").select("scheme_id, amount"),
    ]);

    const totalVolume = (successfulSavingsPayments.data ?? []).reduce((sum, row) => sum + Number(row.amount ?? 0), 0);

    const schemeIds = new Set((allSchemes.data ?? []).map((row) => row.id));
    const paidByScheme = new Map<string, number>();

    for (const row of allSchemePayouts.data ?? []) {
      paidByScheme.set(row.scheme_id, (paidByScheme.get(row.scheme_id) ?? 0) + Number(row.amount ?? 0));
    }

    // Query savings deposits from payment_records for pending payout calculation
    const { data: savingsPaymentsForSchemes } = await adminSupabase
      .from("payment_records")
      .select("metadata, amount")
      .in("type", ["individual_savings", "bulk_contribution"])
      .eq("status", "success");

    const savedByScheme = new Map<string, number>();
    for (const row of savingsPaymentsForSchemes ?? []) {
      const metadata = row.metadata as { goalId?: string; schemeId?: string } | null;
      const schemeId = metadata?.schemeId;
      if (schemeId) {
        savedByScheme.set(schemeId, (savedByScheme.get(schemeId) ?? 0) + Number(row.amount ?? 0));
      }
    }

    let pendingPayoutCount = 0;
    for (const schemeId of schemeIds) {
      const owed = (savedByScheme.get(schemeId) ?? 0) - (paidByScheme.get(schemeId) ?? 0);
      if (owed > 0) pendingPayoutCount += 1;
    }

    // Calculate contributions for current month
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const { data: currentMonthPayments } = await adminSupabase
      .from("payment_records")
      .select("amount")
      .in("type", ["individual_savings", "bulk_contribution"])
      .eq("status", "success")
      .gte("created_at", currentMonthStart.toISOString())
      .lte("created_at", currentMonthEnd.toISOString());

    const contributionsThisMonth = (currentMonthPayments ?? []).reduce((sum, row) => sum + Number(row.amount ?? 0), 0);

    return NextResponse.json({
      data: {
        totalUsers: users.count ?? 0,
        activeGroups: (activeGoals.count ?? 0) + (activeSchemes.count ?? 0),
        pendingPayouts: pendingPayoutCount,
        totalVolume,
        contributionsThisMonth,
      },
    });
  } catch {
    return serverErrorResponse();
  }
}
