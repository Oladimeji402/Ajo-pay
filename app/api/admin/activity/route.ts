import { NextResponse } from "next/server";
import { requireAdmin, serverErrorResponse } from "@/lib/api/auth";

type AdminActivityType = "contribution" | "payout" | "signup" | "group";

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

    const [contributionsResult, payoutsResult, usersResult, groupsResult] = await Promise.all([
      auth.supabase
        .from("contributions")
        .select("id, amount, status, created_at, profiles:user_id(name, email), groups:group_id(name)")
        .order("created_at", { ascending: false })
        .limit(limit),
      auth.supabase
        .from("payouts")
        .select("id, amount, status, created_at, profiles:user_id(name, email), groups:group_id(name)")
        .order("created_at", { ascending: false })
        .limit(limit),
      auth.supabase.from("profiles").select("id, name, email, created_at").order("created_at", { ascending: false }).limit(limit),
      auth.supabase
        .from("groups")
        .select("id, name, category, status, created_at")
        .order("created_at", { ascending: false })
        .limit(limit),
    ]);

    if (contributionsResult.error) {
      return NextResponse.json({ error: contributionsResult.error.message }, { status: 400 });
    }
    if (payoutsResult.error) {
      return NextResponse.json({ error: payoutsResult.error.message }, { status: 400 });
    }
    if (usersResult.error) {
      return NextResponse.json({ error: usersResult.error.message }, { status: 400 });
    }
    if (groupsResult.error) {
      return NextResponse.json({ error: groupsResult.error.message }, { status: 400 });
    }

    const contributionActivities: AdminActivity[] = (contributionsResult.data ?? []).map((item) => {
      const profile = Array.isArray(item.profiles) ? item.profiles[0] : item.profiles;
      const group = Array.isArray(item.groups) ? item.groups[0] : item.groups;

      return {
      id: `contribution-${item.id}`,
      type: "contribution",
      title: "New contribution",
      description: `${profile?.name ?? profile?.email ?? "A user"} contributed NGN ${Number(item.amount ?? 0).toLocaleString()} to ${group?.name ?? "a group"}`,
      timestamp: item.created_at,
      metadata: {
        status: item.status ?? null,
      },
      };
    });

    const payoutActivities: AdminActivity[] = (payoutsResult.data ?? []).map((item) => {
      const profile = Array.isArray(item.profiles) ? item.profiles[0] : item.profiles;
      const group = Array.isArray(item.groups) ? item.groups[0] : item.groups;

      return {
      id: `payout-${item.id}`,
      type: "payout",
      title: "Payout update",
      description: `${profile?.name ?? profile?.email ?? "A user"} payout for ${group?.name ?? "a group"} is ${item.status ?? "pending"}`,
      timestamp: item.created_at,
      metadata: {
        status: item.status ?? null,
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

    const groupActivities: AdminActivity[] = (groupsResult.data ?? []).map((item) => ({
      id: `group-${item.id}`,
      type: "group",
      title: "Group created",
      description: `${item.name} (${item.category ?? "uncategorized"}) was created`,
      timestamp: item.created_at,
      metadata: {
        status: item.status ?? null,
      },
    }));

    const activities = [...contributionActivities, ...payoutActivities, ...signupActivities, ...groupActivities]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);

    return NextResponse.json({ data: { activities } });
  } catch {
    return serverErrorResponse();
  }
}
