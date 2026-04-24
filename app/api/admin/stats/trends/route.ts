import { NextResponse } from "next/server";
import { requireAdmin, serverErrorResponse } from "@/lib/api/auth";

export const revalidate = 60;

type TrendPoint = {
  date: string;
  amount: number;
  count: number;
};

type UserGrowthPoint = {
  date: string;
  count: number;
};

const DAY_MS = 24 * 60 * 60 * 1000;

function getDaysParam(value: string | null) {
  const parsed = Number(value ?? 30);
  if (!Number.isFinite(parsed)) return 30;
  if (parsed <= 0) return 30;
  return Math.min(parsed, 365);
}

function buildDateBuckets(days: number) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return Array.from({ length: days }, (_, index) => {
    const date = new Date(today.getTime() - (days - 1 - index) * DAY_MS);
    return date.toISOString().slice(0, 10);
  });
}

function aggregateTrendData(
  rows: Array<{ created_at: string; amount?: number | null }>,
  buckets: string[],
): TrendPoint[] {
  const base = new Map<string, TrendPoint>(
    buckets.map((date) => [
      date,
      {
        date,
        amount: 0,
        count: 0,
      },
    ]),
  );

  for (const row of rows) {
    const bucket = row.created_at.slice(0, 10);
    const current = base.get(bucket);
    if (!current) continue;

    current.amount += Number(row.amount ?? 0);
    current.count += 1;
  }

  return buckets.map((bucket) => base.get(bucket) as TrendPoint);
}

function aggregateUserGrowth(rows: Array<{ created_at: string }>, buckets: string[]): UserGrowthPoint[] {
  const base = new Map<string, number>(buckets.map((date) => [date, 0]));

  for (const row of rows) {
    const bucket = row.created_at.slice(0, 10);
    if (!base.has(bucket)) continue;

    base.set(bucket, (base.get(bucket) ?? 0) + 1);
  }

  return buckets.map((date) => ({
    date,
    count: base.get(date) ?? 0,
  }));
}

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const url = new URL(request.url);
    const days = getDaysParam(url.searchParams.get("days"));

    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - (days - 1));

    const since = start.toISOString();
    const buckets = buildDateBuckets(days);

    const [targetContributionsResult, schemeDepositsResult, payoutsResult, usersResult] = await Promise.all([
      auth.supabase
        .from("individual_savings_contributions")
        .select("created_at, amount")
        .eq("status", "success")
        .gte("created_at", since),
      auth.supabase
        .from("savings_deposits")
        .select("created_at, amount")
        .eq("status", "success")
        .gte("created_at", since),
      auth.supabase
        .from("passbook_payouts")
        .select("created_at, amount")
        .gte("created_at", since),
      auth.supabase.from("profiles").select("created_at").gte("created_at", since),
    ]);

    if (targetContributionsResult.error) {
      return NextResponse.json({ error: targetContributionsResult.error.message }, { status: 400 });
    }
    if (schemeDepositsResult.error) {
      return NextResponse.json({ error: schemeDepositsResult.error.message }, { status: 400 });
    }
    if (payoutsResult.error) {
      return NextResponse.json({ error: payoutsResult.error.message }, { status: 400 });
    }
    if (usersResult.error) {
      return NextResponse.json({ error: usersResult.error.message }, { status: 400 });
    }

    const contributionTrends = aggregateTrendData(
      [...(targetContributionsResult.data ?? []), ...(schemeDepositsResult.data ?? [])],
      buckets,
    );
    const payoutTrends = aggregateTrendData(payoutsResult.data ?? [], buckets);
    const userGrowth = aggregateUserGrowth(usersResult.data ?? [], buckets);

    return NextResponse.json({
      data: {
        days,
        contributionTrends,
        payoutTrends,
        userGrowth,
      },
    });
  } catch {
    return serverErrorResponse();
  }
}
