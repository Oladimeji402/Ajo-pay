import { NextResponse } from "next/server";
import { z } from "zod";
import { badRequestResponse, requireAdmin, requireUser, serverErrorResponse } from "@/lib/api/auth";

const createGroupSchema = z.object({
  name: z.string().min(1, "name is required"),
  contributionAmount: z.number({ error: "contributionAmount must be a number" }).positive("contributionAmount must be positive"),
  frequency: z.enum(["daily", "weekly", "biweekly", "monthly"], { error: "Invalid frequency value" }),
  maxMembers: z.number().int().min(2, "maxMembers must be at least 2").max(100),
  totalCycles: z.number().int().min(1, "totalCycles must be at least 1"),
  startDate: z.string().min(1, "startDate is required"),
  category: z.string().optional(),
  whatsappGroupPhone: z.string().optional().nullable(),
  status: z.string().optional(),
  color: z.string().optional(),
  inviteCode: z.string().optional(),
});

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
      // Regular users may discover joinable groups (metadata only — no member PII).
      // Admins see all statuses; regular users only see pending/active groups.
      const adminCheck = await requireAdmin();
      const isAdmin = !adminCheck.error;

      const DISCOVER_FIELDS = "id, name, invite_code, contribution_amount, frequency, max_members, current_cycle, total_cycles, start_date, status, color, category";

      if (isAdmin) {
        // Admins: unrestricted full list
        let query = auth.supabase
          .from("groups")
          .select(DISCOVER_FIELDS)
          .order("created_at", { ascending: false });
        query = applyFilters(query);
        const { data, error } = await query;
        if (error) return serverErrorResponse(error);
        return NextResponse.json({ data });
      }

      // Regular users: only joinable groups
      let query = auth.supabase
        .from("groups")
        .select(DISCOVER_FIELDS)
        .in("status", ["pending", "active"])
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

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return badRequestResponse("Invalid JSON body.");
    }

    const parsed = createGroupSchema.safeParse(body);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Validation failed.";
      return badRequestResponse(message);
    }

    const d = parsed.data;
    const payload = {
      name: d.name.trim(),
      category: d.category ? String(d.category) : "ajo",
      contribution_amount: d.contributionAmount,
      frequency: d.frequency.toLowerCase(),
      max_members: d.maxMembers,
      total_cycles: d.totalCycles,
      start_date: d.startDate,
      whatsapp_group_phone: d.whatsappGroupPhone ?? null,
      status: d.status ? String(d.status).toLowerCase() : "pending",
      color: d.color ?? "#3B82F6",
      invite_code: d.inviteCode ? d.inviteCode.toUpperCase() : undefined,
      created_by: auth.user?.id,
    };

    const { data, error } = await auth.supabase.from("groups").insert(payload).select("*").single();
    if (error) return badRequestResponse(error.message);

    return NextResponse.json({ data }, { status: 201 });
  } catch {
    return serverErrorResponse();
  }
}
