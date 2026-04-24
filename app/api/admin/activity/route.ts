import { NextResponse } from "next/server";
import { requireAdmin, serverErrorResponse } from "@/lib/api/auth";

type AdminActivityType = "contribution" | "payout" | "signup";

type AdminActivity = {
  id: string;
  type: AdminActivityType;
  title: string;
  description: string;
  timestamp: string;
  metadata?: Record<string, string | number | null>;
};

function getLimitParam(value: string | null) {
  const parsed = Number(value ?? 20);
  if (!Number.isFinite(parsed)) return 20;
  if (parsed <= 0) return 20;
  return Math.min(parsed, 100);
}

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const url = new URL(request.url);
    const limit = getLimitParam(url.searchParams.get("limit"));

    const [targetContributionsResult, schemeDepositsResult, payoutsResult, usersResult] = await Promise.all([
      auth.supabase
        .from("individual_savings_contributions")
        .select("id, amount, status, created_at, profiles:user_id(name, email), goals:goal_id(name)")
        .order("created_at", { ascending: false })
        .limit(limit),
      auth.supabase
        .from("savings_deposits")
        .select("id, amount, status, created_at, profiles:user_id(name, email), schemes:scheme_id(name)")
        .order("created_at", { ascending: false })
        .limit(limit),
      auth.supabase
        .from("passbook_payouts")
        .select("id, amount, period_label, created_at, profiles:user_id(name, email), schemes:scheme_id(name)")
        .order("created_at", { ascending: false })
        .limit(limit),
      auth.supabase.from("profiles").select("id, name, email, created_at").order("created_at", { ascending: false }).limit(limit),
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

    const contributionActivities: AdminActivity[] = (targetContributionsResult.data ?? []).map((item) => {
      const profile = Array.isArray(item.profiles) ? item.profiles[0] : item.profiles;
      const goal = Array.isArray(item.goals) ? item.goals[0] : item.goals;

      return {
      id: `contribution-${item.id}`,
      type: "contribution",
      title: "Target contribution",
      description: `${profile?.name ?? profile?.email ?? "A user"} contributed NGN ${Number(item.amount ?? 0).toLocaleString()} to ${goal?.name ?? "a target plan"}`,
      timestamp: item.created_at,
      metadata: {
        status: item.status ?? null,
      },
      };
    });

    const generalContributionActivities: AdminActivity[] = (schemeDepositsResult.data ?? []).map((item) => {
      const profile = Array.isArray(item.profiles) ? item.profiles[0] : item.profiles;
      const scheme = Array.isArray(item.schemes) ? item.schemes[0] : item.schemes;

      return {
      id: `scheme-contribution-${item.id}`,
      type: "contribution",
      title: "General contribution",
      description: `${profile?.name ?? profile?.email ?? "A user"} contributed NGN ${Number(item.amount ?? 0).toLocaleString()} to ${scheme?.name ?? "a general plan"}`,
      timestamp: item.created_at,
      metadata: {
        status: item.status ?? null,
        amount: Number(item.amount ?? 0),
      },
      };
    });

    const payoutActivities: AdminActivity[] = (payoutsResult.data ?? []).map((item) => {
      const profile = Array.isArray(item.profiles) ? item.profiles[0] : item.profiles;
      const scheme = Array.isArray(item.schemes) ? item.schemes[0] : item.schemes;

      return {
        id: `payout-${item.id}`,
        type: "payout",
        title: "Savings payout recorded",
        description: `${profile?.name ?? profile?.email ?? "A user"} payout for ${scheme?.name ?? "a general plan"} (${item.period_label || "period"})`,
        timestamp: item.created_at,
        metadata: {
          amount: Number(item.amount ?? 0),
        },
      };
    });

    const signupActivities: AdminActivity[] = (usersResult.data ?? []).map((item) => ({
      id: `signup-${item.id}`,
      type: "signup",
      title: "New signup",
      description: `${item.name || item.email || "A user"} joined Subtech Ajo Solution`,
      timestamp: item.created_at,
    }));

    const activities = [...contributionActivities, ...generalContributionActivities, ...payoutActivities, ...signupActivities]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);

    return NextResponse.json({ data: { activities } });
  } catch {
    return serverErrorResponse();
  }
}
