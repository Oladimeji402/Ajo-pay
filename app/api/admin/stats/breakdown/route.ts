import { NextResponse } from "next/server";
import { requireAdmin, serverErrorResponse } from "@/lib/api/auth";

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

    const [groupsResult, contributionsResult, usersResult] = await Promise.all([
      auth.supabase.from("groups").select("category, status"),
      auth.supabase.from("contributions").select("status, amount"),
      auth.supabase.from("profiles").select("role, status"),
    ]);

    if (groupsResult.error) {
      return NextResponse.json({ error: groupsResult.error.message }, { status: 400 });
    }
    if (contributionsResult.error) {
      return NextResponse.json({ error: contributionsResult.error.message }, { status: 400 });
    }
    if (usersResult.error) {
      return NextResponse.json({ error: usersResult.error.message }, { status: 400 });
    }

    const groups = groupsResult.data ?? [];
    const contributions = contributionsResult.data ?? [];
    const users = usersResult.data ?? [];

    const groupsByCategory = mapToPoints(
      toBreakdownMap(groups.map((group) => group.category ?? "uncategorized")),
    );

    const groupsByStatus = mapToPoints(toBreakdownMap(groups.map((group) => group.status ?? "unknown")));

    const contributionStatusTotals = new Map<string, number>();
    for (const contribution of contributions) {
      const key = contribution.status ?? "unknown";
      contributionStatusTotals.set(key, (contributionStatusTotals.get(key) ?? 0) + Number(contribution.amount ?? 0));
    }
    const contributionsByStatus = mapToPoints(contributionStatusTotals);

    const usersByStatus = mapToPoints(toBreakdownMap(users.map((user) => user.status ?? "unknown")));
    const usersByRole = mapToPoints(toBreakdownMap(users.map((user) => user.role ?? "unknown")));

    return NextResponse.json({
      data: {
        groupsByCategory,
        groupsByStatus,
        contributionsByStatus,
        usersByStatus,
        usersByRole,
      },
    });
  } catch {
    return serverErrorResponse();
  }
}
