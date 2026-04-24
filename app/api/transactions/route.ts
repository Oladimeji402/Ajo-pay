import { NextResponse } from "next/server";
import { badRequestResponse, requireUser, serverErrorResponse } from "@/lib/api/auth";
import { reconcileStalePendingPayments } from "@/lib/payments";

type TxRow = {
  id: string;
  type: string;
  metadata?: Record<string, unknown> | null;
};

function extractGoalIds(rows: TxRow[]) {
  const ids = new Set<string>();
  for (const row of rows) {
    const metadata = (row.metadata ?? {}) as Record<string, unknown>;
    const singleGoalId = typeof metadata.goalId === "string" ? metadata.goalId : null;
    if (singleGoalId) ids.add(singleGoalId);
    const bulkGoalIds = Array.isArray(metadata.goalIds) ? metadata.goalIds : [];
    for (const id of bulkGoalIds) {
      if (typeof id === "string") ids.add(id);
    }
  }
  return Array.from(ids);
}

export async function GET(request: Request) {
  try {
    const auth = await requireUser();
    if (auth.error || !auth.user) return auth.error;

    await reconcileStalePendingPayments({ userId: auth.user.id, limit: 10 });

    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const type = url.searchParams.get("type");
    const page = Math.max(Number(url.searchParams.get("page") ?? 1), 1);
    const pageSize = Math.min(Math.max(Number(url.searchParams.get("pageSize") ?? 20), 1), 100);

    let query = auth.supabase
      .from("payment_records")
      .select("*, groups:group_id(id, name)", { count: "exact" })
      .eq("user_id", auth.user.id)
      .order("created_at", { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);

    if (status) query = query.eq("status", status);
    if (type) query = query.eq("type", type);

    const { data, error, count } = await query;
    if (error) return badRequestResponse(error.message);

    const rows = Array.isArray(data) ? (data as TxRow[]) : [];
    const goalIds = extractGoalIds(rows);
    const goalNameById = new Map<string, string>();

    if (goalIds.length > 0) {
      const { data: goals } = await auth.supabase
        .from("individual_savings_goals")
        .select("id, name")
        .in("id", goalIds);
      for (const goal of goals ?? []) {
        if (goal?.id && goal?.name) goalNameById.set(goal.id, goal.name);
      }
    }

    const enrichedRows = rows.map((row) => {
      const metadata = (row.metadata ?? {}) as Record<string, unknown>;
      if (row.type === "individual_savings") {
        const goalId = typeof metadata.goalId === "string" ? metadata.goalId : null;
        const goalName = goalId ? goalNameById.get(goalId) : null;
        return {
          ...row,
          metadata: {
            ...metadata,
            goalName: goalName ?? metadata.goalName ?? null,
          },
        };
      }
      if (row.type === "bulk_contribution") {
        const bulkGoalIds = Array.isArray(metadata.goalIds) ? metadata.goalIds : [];
        const namedGoals = bulkGoalIds
          .map((id) => (typeof id === "string" ? goalNameById.get(id) : null))
          .filter((name): name is string => Boolean(name));
        return {
          ...row,
          metadata: {
            ...metadata,
            goalNames: namedGoals,
          },
        };
      }
      return row;
    });

    return NextResponse.json({
      data: enrichedRows,
      pagination: {
        page,
        pageSize,
        total: count ?? 0,
      },
    });
  } catch {
    return serverErrorResponse();
  }
}
