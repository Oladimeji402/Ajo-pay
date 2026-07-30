import { NextResponse } from "next/server";
import { requireUser, serverErrorResponse } from "@/lib/api/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

async function addMemberCounts<T extends { id: string }>(rows: T[]): Promise<Array<T & { member_count: number }>> {
  if (rows.length === 0) return rows.map((r) => ({ ...r, member_count: 0 }));
  const admin = createSupabaseAdminClient();
  const { data: memberRows } = await admin
    .from("group_members")
    .select("group_id")
    .in(
      "group_id",
      rows.map((r) => r.id),
    );
  const counts: Record<string, number> = {};
  for (const row of memberRows ?? []) {
    counts[row.group_id] = (counts[row.group_id] ?? 0) + 1;
  }
  return rows.map((r) => ({ ...r, member_count: counts[r.id] ?? 0 }));
}

export async function GET(request: Request) {
  try {
    const auth = await requireUser();
    if (auth.error || !auth.user) return auth.error;

    const url = new URL(request.url);
    const category = url.searchParams.get("category");
    const scope = (url.searchParams.get("scope") || "joined").toLowerCase();
    const q = (url.searchParams.get("q") || "").trim();

    const applyFilters = <
      T extends {
        eq: (column: string, value: string) => T;
        or: (filters: string) => T;
      },
    >(
      query: T,
    ) => {
      let nextQuery = query;

      if (category) {
        nextQuery = nextQuery.eq("category", category);
      }

      if (q) {
        const safeQuery = q.replace(/,/g, "");
        nextQuery = nextQuery.or(`name.ilike.%${safeQuery}%,invite_code.ilike.%${safeQuery}%`);
      }

      return nextQuery;
    };

    if (scope === "all") {
      // Discover joinable groups only (metadata — no member PII).
      const DISCOVER_FIELDS =
        "id, name, invite_code, contribution_amount, frequency, max_members, current_cycle, total_cycles, start_date, status, color, category";

      let query = auth.supabase
        .from("groups")
        .select(DISCOVER_FIELDS)
        .in("status", ["pending", "active"])
        .order("created_at", { ascending: false });
      query = applyFilters(query);
      const { data, error } = await query;
      if (error) return serverErrorResponse(error);
      return NextResponse.json({ data: await addMemberCounts(data ?? []) });
    }

    const { data: memberships, error: membershipError } = await auth.supabase
      .from("group_members")
      .select("group_id")
      .eq("user_id", auth.user.id);

    if (membershipError) return serverErrorResponse(membershipError);

    const groupIds = (memberships ?? []).map((member) => member.group_id);
    if (groupIds.length === 0) {
      return NextResponse.json({ data: [] });
    }

    let query = auth.supabase
      .from("groups")
      .select("*")
      .in("id", groupIds)
      .order("created_at", { ascending: false });

    query = applyFilters(query);

    const { data, error } = await query;

    if (error) return serverErrorResponse(error);
    return NextResponse.json({ data: await addMemberCounts(data ?? []) });
  } catch {
    return serverErrorResponse();
  }
}
