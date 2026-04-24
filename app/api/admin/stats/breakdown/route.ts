import { NextResponse } from "next/server";
import { requireAdmin, serverErrorResponse } from "@/lib/api/auth";

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

    const [targetGoalsResult, targetContributionsResult, generalSchemesResult, generalDepositsResult, usersResult] = await Promise.all([
      auth.supabase.from("individual_savings_goals").select("id, name"),
      auth.supabase.from("individual_savings_contributions").select("status, amount, goal_id"),
      auth.supabase.from("savings_schemes").select("id, name"),
      auth.supabase.from("savings_deposits").select("status, amount, scheme_id"),
      auth.supabase.from("profiles").select("role, status"),
    ]);

    if (targetGoalsResult.error) {
      return NextResponse.json({ error: targetGoalsResult.error.message }, { status: 400 });
    }
    if (targetContributionsResult.error) {
      return NextResponse.json({ error: targetContributionsResult.error.message }, { status: 400 });
    }
    if (generalSchemesResult.error) {
      return NextResponse.json({ error: generalSchemesResult.error.message }, { status: 400 });
    }
    if (generalDepositsResult.error) {
      return NextResponse.json({ error: generalDepositsResult.error.message }, { status: 400 });
    }
    if (usersResult.error) {
      return NextResponse.json({ error: usersResult.error.message }, { status: 400 });
    }

    const targetGoals = targetGoalsResult.data ?? [];
    const targetContributions = targetContributionsResult.data ?? [];
    const generalSchemes = generalSchemesResult.data ?? [];
    const generalDeposits = generalDepositsResult.data ?? [];
    const users = usersResult.data ?? [];

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
      if (!contribution.goal_id) continue;
      const key = `target:${contribution.goal_id}`;
      sourceContributionTotals.set(key, (sourceContributionTotals.get(key) ?? 0) + Number(contribution.amount ?? 0));
    }
    for (const deposit of generalDeposits) {
      if (deposit.status !== "success") continue;
      if (!deposit.scheme_id) continue;
      const key = `general:${deposit.scheme_id}`;
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
