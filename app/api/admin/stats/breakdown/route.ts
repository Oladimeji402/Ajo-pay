import { NextResponse } from "next/server";
import { requireAdmin, serverErrorResponse } from "@/lib/api/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const revalidate = 60;

type BreakdownPoint = {
  name: string;
  value: number;
};

function toBreakdownMap(values: string[]) {
  const map = new Map<string, number>();
  for (const value of values) {
    map.set(value, (map.get(value) ?? 0) + 1);
  }
  return map;
}

function mapToPoints(map: Map<string, number>): BreakdownPoint[] {
  return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
}

export async function GET() {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const adminSupabase = createSupabaseAdminClient();

    const [targetGoalsResult, savingsPaymentsResult, generalSchemesResult, usersResult] = await Promise.all([
      adminSupabase.from("individual_savings_goals").select("id, name"),
      adminSupabase.from("payment_records").select("status, amount, metadata").in("type", ["individual_savings", "bulk_contribution"]),
      adminSupabase.from("savings_schemes").select("id, name"),
      adminSupabase.from("profiles").select("role, status"),
    ]);

    if (targetGoalsResult.error) {
      return NextResponse.json({ error: targetGoalsResult.error.message }, { status: 400 });
    }
    if (savingsPaymentsResult.error) {
      return NextResponse.json({ error: savingsPaymentsResult.error.message }, { status: 400 });
    }
    if (generalSchemesResult.error) {
      return NextResponse.json({ error: generalSchemesResult.error.message }, { status: 400 });
    }
    if (usersResult.error) {
      return NextResponse.json({ error: usersResult.error.message }, { status: 400 });
    }

    const targetGoals = targetGoalsResult.data ?? [];
    const savingsPayments = savingsPaymentsResult.data ?? [];
    const generalSchemes = generalSchemesResult.data ?? [];
    const users = usersResult.data ?? [];

    // Parse payments to separate target contributions and general deposits
    const targetContributions = savingsPayments.filter(payment => {
      const metadata = payment.metadata as { goalId?: string; schemeId?: string } | null;
      return metadata?.goalId;
    });

    const generalDeposits = savingsPayments.filter(payment => {
      const metadata = payment.metadata as { goalId?: string; schemeId?: string } | null;
      return metadata?.schemeId;
    });

    const groupsByCategory = [
      { name: "target", value: targetGoals.length },
      { name: "general", value: generalSchemes.length },
    ];

    const contributionStatusTotals = new Map<string, number>();
    for (const contribution of targetContributions) {
      const key = contribution.status ?? "unknown";
      contributionStatusTotals.set(key, (contributionStatusTotals.get(key) ?? 0) + Number(contribution.amount ?? 0));
    }
    for (const deposit of generalDeposits) {
      const key = deposit.status ?? "unknown";
      contributionStatusTotals.set(key, (contributionStatusTotals.get(key) ?? 0) + Number(deposit.amount ?? 0));
    }
    const contributionsByStatus = mapToPoints(contributionStatusTotals);

    const usersByStatus = mapToPoints(toBreakdownMap(users.map((user) => user.status ?? "unknown")));
    const usersByRole = mapToPoints(toBreakdownMap(users.map((user) => user.role ?? "unknown")));

    const targetNameLookup = new Map<string, string>();
    for (const goal of targetGoals) {
      targetNameLookup.set(goal.id, goal.name ?? "Unnamed target");
    }
    const schemeNameLookup = new Map<string, string>();
    for (const scheme of generalSchemes) {
      schemeNameLookup.set(scheme.id, scheme.name ?? "Unnamed general plan");
    }

    const sourceContributionTotals = new Map<string, number>();
    for (const contribution of targetContributions) {
      if (contribution.status !== "success") continue;
      const metadata = contribution.metadata as { goalId?: string } | null;
      const goalId = metadata?.goalId;
      if (!goalId) continue;
      const key = `target:${goalId}`;
      sourceContributionTotals.set(key, (sourceContributionTotals.get(key) ?? 0) + Number(contribution.amount ?? 0));
    }
    for (const deposit of generalDeposits) {
      if (deposit.status !== "success") continue;
      const metadata = deposit.metadata as { schemeId?: string } | null;
      const schemeId = metadata?.schemeId;
      if (!schemeId) continue;
      const key = `general:${schemeId}`;
      sourceContributionTotals.set(key, (sourceContributionTotals.get(key) ?? 0) + Number(deposit.amount ?? 0));
    }

    const topGroupsByContributions = Array.from(sourceContributionTotals.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([sourceKey, total]) => {
        const [sourceType, sourceId] = sourceKey.split(":");
        const sourceName = sourceType === "target"
          ? targetNameLookup.get(sourceId) ?? "Unnamed target"
          : schemeNameLookup.get(sourceId) ?? "Unnamed general plan";
        return {
          name: sourceName,
          value: total,
        };
      });

    return NextResponse.json({
      data: {
        groupsByCategory,
        groupsByStatus: [],
        contributionsByStatus,
        usersByStatus,
        usersByRole,
        topGroupsByContributions,
      },
    });
  } catch {
    return serverErrorResponse();
  }
}
