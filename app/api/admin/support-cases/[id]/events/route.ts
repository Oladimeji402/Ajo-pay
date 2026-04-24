import { NextResponse } from "next/server";
import { z } from "zod";
import { badRequestResponse, requireAdmin, serverErrorResponse } from "@/lib/api/auth";
import { logAdminAction } from "@/lib/admin-audit";

const createEventSchema = z.object({
  eventType: z.string().min(2),
  reference: z.string().optional(),
  details: z.record(z.string(), z.unknown()).optional(),
});

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const params = await context.params;
    const caseId = params.id;
    if (!caseId) return badRequestResponse("Case id is required.");

    const { data, error } = await auth.supabase
      .from("support_case_events")
      .select("*")
      .eq("case_id", caseId)
      .order("created_at", { ascending: false });
    if (error) return badRequestResponse(error.message);

    return NextResponse.json({ data: data ?? [] });
  } catch (error) {
    return serverErrorResponse(error);
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAdmin();
    if (auth.error || !auth.user) return auth.error;

    const params = await context.params;
    const caseId = params.id;
    if (!caseId) return badRequestResponse("Case id is required.");

    const parsed = createEventSchema.safeParse(await request.json());
    if (!parsed.success) return badRequestResponse(parsed.error.issues[0]?.message ?? "Invalid payload.");

    const { data, error } = await auth.supabase
      .from("support_case_events")
      .insert({
        case_id: caseId,
        event_type: parsed.data.eventType,
        reference: parsed.data.reference ?? null,
        actor_type: "admin",
        actor_id: auth.user.id,
        details_json: parsed.data.details ?? {},
      })
      .select("*")
      .single();
    if (error) return badRequestResponse(error.message);

    await logAdminAction({
      adminId: auth.user.id,
      action: "support_case_event_created",
      targetType: "support_case",
      targetId: caseId,
      metadata: { eventType: parsed.data.eventType, reference: parsed.data.reference ?? null },
    });

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return serverErrorResponse(error);
  }
}
