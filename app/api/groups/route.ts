import { NextResponse } from "next/server";
import { badRequestResponse, requireAdmin, requireUser, serverErrorResponse } from "@/lib/api/auth";

export async function GET(request: Request) {
  try {
    const auth = await requireUser();
    if (auth.error || !auth.user) return auth.error;

    const url = new URL(request.url);
    const category = url.searchParams.get("category");
    const scope = (url.searchParams.get("scope") || "joined").toLowerCase();
    const q = (url.searchParams.get("q") || "").trim();

    const applyFilters = <T extends {
      eq: (column: string, value: string) => T;
      or: (filters: string) => T;
    }>(query: T) => {
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
      let query = auth.supabase
        .from("groups")
        .select("*")
        .order("created_at", { ascending: false });

      query = applyFilters(query);

      const { data, error } = await query;
      if (error) return serverErrorResponse(error);

      return NextResponse.json({ data });
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
    return NextResponse.json({ data });
  } catch {
    return serverErrorResponse();
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const body = await request.json();
    if (!body.name || !body.contributionAmount || !body.frequency || !body.maxMembers || !body.totalCycles) {
      return badRequestResponse("Missing required fields for group creation.");
    }

    const payload = {
      name: String(body.name),
      category: body.category ? String(body.category) : "ajo",
      contribution_amount: Number(body.contributionAmount),
      frequency: String(body.frequency).toLowerCase(),
      max_members: Number(body.maxMembers),
      total_cycles: Number(body.totalCycles),
      start_date: body.startDate ? String(body.startDate) : null,
      whatsapp_group_phone: body.whatsappGroupPhone ? String(body.whatsappGroupPhone) : null,
      status: body.status ? String(body.status).toLowerCase() : "pending",
      color: body.color ? String(body.color) : "#3B82F6",
      invite_code: body.inviteCode ? String(body.inviteCode).toUpperCase() : undefined,
      created_by: auth.user?.id,
    };

    const { data, error } = await auth.supabase.from("groups").insert(payload).select("*").single();
    if (error) return badRequestResponse(error.message);

    return NextResponse.json({ data }, { status: 201 });
  } catch {
    return serverErrorResponse();
  }
}
