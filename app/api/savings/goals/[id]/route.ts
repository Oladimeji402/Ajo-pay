import { NextResponse } from "next/server";
import { z } from "zod";
import { badRequestResponse, requireUser, serverErrorResponse } from "@/lib/api/auth";

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  priority: z.number().int().min(1).max(5).optional(),
  status: z.enum(["active", "paused", "completed", "cancelled"]).optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireUser();
    if (auth.error || !auth.user) return auth.error!;

    const { id } = await params;

    const { data, error } = await auth.supabase
      .from("individual_savings_goals")
      .select("*, festive_periods(id, name, emoji, color, category, suggested_frequency), individual_savings_contributions(*)")
      .eq("id", id)
      .eq("user_id", auth.user.id)
      .maybeSingle();

    if (error) return badRequestResponse(error.message);
    if (!data) return NextResponse.json({ error: "Goal not found." }, { status: 404 });

    return NextResponse.json({ data });
  } catch {
    return serverErrorResponse();
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireUser();
    if (auth.error || !auth.user) return auth.error!;

    const { id } = await params;
    let body: unknown;
    try { body = await request.json(); } catch { return badRequestResponse("Invalid JSON."); }

    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return badRequestResponse(parsed.error.issues[0]?.message ?? "Validation failed.");
    }

    const { data, error } = await auth.supabase
      .from("individual_savings_goals")
      .update(parsed.data)
      .eq("id", id)
      .eq("user_id", auth.user.id)
      .select()
      .single();

    if (error) return badRequestResponse(error.message);
    return NextResponse.json({ data });
  } catch {
    return serverErrorResponse();
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireUser();
    if (auth.error || !auth.user) return auth.error!;

    const { id } = await params;

    const { error } = await auth.supabase
      .from("individual_savings_goals")
      .update({ status: "cancelled" })
      .eq("id", id)
      .eq("user_id", auth.user.id);

    if (error) return badRequestResponse(error.message);
    return NextResponse.json({ data: { cancelled: true } });
  } catch {
    return serverErrorResponse();
  }
}
