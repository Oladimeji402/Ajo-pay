import { NextResponse } from "next/server";
import { z } from "zod";
import { badRequestResponse, requireAdmin, serverErrorResponse } from "@/lib/api/auth";
import { logAdminAction } from "@/lib/admin-audit";

const createSchema = z.object({
  userId: z.string().uuid(),
  reference: z.string().optional(),
  severity: z.enum(["low", "medium", "high", "critical"]).default("medium"),
  summary: z.string().min(3),
  complaintType: z.string().default("payment"),
});

function generateCaseNumber() {
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `CASE-${Date.now()}-${rand}`;
}

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const search = url.searchParams.get("search");
    const page = Math.max(Number(url.searchParams.get("page") ?? 1), 1);
    const pageSize = Math.min(Math.max(Number(url.searchParams.get("pageSize") ?? 20), 1), 100);

    let query = auth.supabase
      .from("support_cases")
      .select("*, profiles:user_id(id, name, email, phone)", { count: "exact" })
      .order("created_at", { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);

    if (status) query = query.eq("status", status);
    if (search) query = query.ilike("summary", `%${search}%`);

    const { data, error, count } = await query;
    if (error) return badRequestResponse(error.message);

    return NextResponse.json({ data: data ?? [], pagination: { page, pageSize, total: count ?? 0 } });
  } catch (error) {
    return serverErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAdmin();
    if (auth.error || !auth.user) return auth.error;

    const parsed = createSchema.safeParse(await request.json());
    if (!parsed.success) return badRequestResponse(parsed.error.issues[0]?.message ?? "Invalid payload");

    const caseNumber = generateCaseNumber();
    const { data: row, error } = await auth.supabase
      .from("support_cases")
      .insert({
        case_number: caseNumber,
        user_id: parsed.data.userId,
        opened_by_admin_id: auth.user.id,
        owner_admin_id: auth.user.id,
        status: "open",
        severity: parsed.data.severity,
        complaint_type: parsed.data.complaintType,
        summary: parsed.data.summary,
      })
      .select("*")
      .single();
    if (error) return badRequestResponse(error.message);

    await auth.supabase.from("support_case_events").insert({
      case_id: row.id,
      event_type: "case_opened",
      reference: parsed.data.reference ?? null,
      actor_type: "admin",
      actor_id: auth.user.id,
      details_json: { summary: parsed.data.summary, complaintType: parsed.data.complaintType },
    });

    await logAdminAction({
      adminId: auth.user.id,
      action: "support_case_created",
      targetType: "support_case",
      targetId: row.id,
      metadata: { caseNumber, userId: parsed.data.userId, reference: parsed.data.reference ?? null },
    });

    return NextResponse.json({ data: row }, { status: 201 });
  } catch (error) {
    return serverErrorResponse(error);
  }
}
