import { NextResponse } from "next/server";
import { requireUser, serverErrorResponse } from "@/lib/api/auth";

// Period bucket helpers
function monthBucket(date: Date): number { return date.getMonth() + 1; }           // 1–12
function dowBucket(date: Date): number {                                              // 1=Mon … 7=Sun
  const d = date.getDay(); // 0=Sun … 6=Sat
  return d === 0 ? 7 : d;
}

function currentWeekStart(): Date {
  const now = new Date();
  const day = now.getDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day; // shift to Monday
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function currentQuarterStart(): Date {
  const now = new Date();
  const month = now.getMonth(); // 0..11
  const qStartMonth = Math.floor(month / 3) * 3;
  return new Date(now.getFullYear(), qStartMonth, 1);
}

function nextQuarterStart(fromQuarterStart: Date): Date {
  return new Date(fromQuarterStart.getFullYear(), fromQuarterStart.getMonth() + 3, 1);
}

function weeklyBucketInQuarter(date: Date, quarterStart: Date): number {
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const diff = date.getTime() - quarterStart.getTime();
  return Math.floor(diff / msPerWeek) + 1; // W1..W13/14
}

type Deposit = { amount: number; paid_at: string };
type Payout  = { amount: number; paid_at: string; period_label: string };

function aggregateDeposits(
  deposits: Deposit[],
  frequency: "daily" | "weekly" | "monthly",
): {
  bf: number;
  buckets: Record<number, number>;
  total: number;
} {
  const now = new Date();
  const currentYear = now.getFullYear();
  const weekStart = currentWeekStart();
  const quarterStart = currentQuarterStart();
  const quarterEnd = nextQuarterStart(quarterStart);

  let bf = 0;
  const buckets: Record<number, number> = {};

  for (const d of deposits) {
    const date = new Date(d.paid_at);
    const amt = Number(d.amount);

    if (frequency === "monthly") {
      if (date.getFullYear() < currentYear) { bf += amt; continue; }
      if (date.getFullYear() > currentYear) continue;
      const b = monthBucket(date);
      buckets[b] = (buckets[b] ?? 0) + amt;
    } else if (frequency === "weekly") {
      // Weekly uses current quarter buckets (W1...); anything before current quarter = B/F
      if (date < quarterStart) { bf += amt; continue; }
      if (date >= quarterEnd) continue;
      const b = weeklyBucketInQuarter(date, quarterStart);
      buckets[b] = (buckets[b] ?? 0) + amt;
    } else {
      // daily — current week Mon–Sun; anything before = B/F
      if (date < weekStart) { bf += amt; continue; }
      const b = dowBucket(date);
      buckets[b] = (buckets[b] ?? 0) + amt;
    }
  }

  const total = bf + Object.values(buckets).reduce((s, v) => s + v, 0);
  return { bf, buckets, total };
}

export async function GET() {
  try {
    const auth = await requireUser();
    if (auth.error || !auth.user) return auth.error!;

    // Load all non-cancelled general savings schemes
    const { data: schemes, error: sErr } = await auth.supabase
      .from("savings_schemes")
      .select("id, name, frequency, minimum_amount, status")
      .eq("user_id", auth.user.id)
      .neq("status", "cancelled")
      .order("created_at", { ascending: true });

    if (sErr) throw new Error(sErr.message);

    // Load all non-cancelled target savings goals
    const { data: goals, error: gErr } = await auth.supabase
      .from("individual_savings_goals")
      .select("id, name, frequency, contribution_amount, status")
      .eq("user_id", auth.user.id)
      .neq("status", "cancelled")
      .order("created_at", { ascending: true });

    if (gErr) throw new Error(gErr.message);

    if (!schemes?.length && !goals?.length) {
      return NextResponse.json({ data: { daily: [], weekly: [], monthly: [] } });
    }

    const schemeIds = (schemes ?? []).map((s) => s.id);
    const goalIds = (goals ?? []).map((g) => g.id);

    // Load all successful deposits for these schemes
    const { data: deposits, error: dErr } = await auth.supabase
      .from("savings_deposits")
      .select("scheme_id, amount, paid_at")
      .in("scheme_id", schemeIds.length ? schemeIds : ["00000000-0000-0000-0000-000000000000"])
      .eq("status", "success")
      .order("paid_at", { ascending: true });

    if (dErr) throw new Error(dErr.message);

    // Load all payouts
    const { data: payouts, error: pErr } = await auth.supabase
      .from("passbook_payouts")
      .select("scheme_id, amount, paid_at, period_label")
      .in("scheme_id", schemeIds.length ? schemeIds : ["00000000-0000-0000-0000-000000000000"])
      .order("paid_at", { ascending: true });

    if (pErr) throw new Error(pErr.message);

    // Load successful target savings contributions (these are paid target deposits)
    const { data: targetContribs, error: tErr } = await auth.supabase
      .from("individual_savings_contributions")
      .select("goal_id, amount, paid_at, period_date")
      .in("goal_id", goalIds.length ? goalIds : ["00000000-0000-0000-0000-000000000000"])
      .eq("status", "success")
      .order("paid_at", { ascending: true });

    if (tErr) throw new Error(tErr.message);

    // Group deposits and payouts by scheme
    const depositsByScheme = new Map<string, Deposit[]>();
    const payoutsByScheme  = new Map<string, Payout[]>();

    for (const d of deposits ?? []) {
      const list = depositsByScheme.get(d.scheme_id) ?? [];
      list.push({ amount: Number(d.amount), paid_at: d.paid_at });
      depositsByScheme.set(d.scheme_id, list);
    }
    for (const p of payouts ?? []) {
      const list = payoutsByScheme.get(p.scheme_id) ?? [];
      list.push({ amount: Number(p.amount), paid_at: p.paid_at, period_label: p.period_label });
      payoutsByScheme.set(p.scheme_id, list);
    }

    // Group target contributions by goal
    const depositsByGoal = new Map<string, Deposit[]>();
    for (const c of targetContribs ?? []) {
      const paidAt = c.paid_at ?? `${c.period_date}T00:00:00.000Z`;
      const list = depositsByGoal.get(c.goal_id) ?? [];
      list.push({ amount: Number(c.amount), paid_at: paidAt });
      depositsByGoal.set(c.goal_id, list);
    }

    const daily: unknown[] = [];
    const weekly: unknown[] = [];
    const monthly: unknown[] = [];

    for (const scheme of schemes) {
      const freq = scheme.frequency as "daily" | "weekly" | "monthly";
      const deps = depositsByScheme.get(scheme.id) ?? [];
      const pays = payoutsByScheme.get(scheme.id)  ?? [];
      const { bf, buckets, total } = aggregateDeposits(deps, freq);
      const totalWithdrawals = pays.reduce((s, p) => s + Number(p.amount), 0);

      const row = {
        id: scheme.id,
        name: scheme.name,
        source_type: "general",
        frequency: freq,
        minimum_amount: Number(scheme.minimum_amount),
        status: scheme.status,
        bf,
        buckets,
        total,
        totalWithdrawals,
        payouts: pays,
      };

      if (freq === "daily")   daily.push(row);
      if (freq === "weekly")  weekly.push(row);
      if (freq === "monthly") monthly.push(row);
    }

    for (const goal of goals ?? []) {
      const freq = goal.frequency as "daily" | "weekly" | "monthly";
      const deps = depositsByGoal.get(goal.id) ?? [];
      const { bf, buckets, total } = aggregateDeposits(deps, freq);

      const row = {
        id: goal.id,
        name: goal.name,
        source_type: "target",
        frequency: freq,
        minimum_amount: Number(goal.contribution_amount ?? 0),
        status: goal.status,
        bf,
        buckets,
        total,
        totalWithdrawals: 0,
        payouts: [],
      };

      if (freq === "daily")   daily.push(row);
      if (freq === "weekly")  weekly.push(row);
      if (freq === "monthly") monthly.push(row);
    }

    return NextResponse.json({ data: { daily, weekly, monthly } });
  } catch (error) {
    return serverErrorResponse(error);
  }
}
