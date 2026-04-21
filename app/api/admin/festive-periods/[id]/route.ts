import { NextResponse } from "next/server";
import { z } from "zod";
import { badRequestResponse, requireAdmin, serverErrorResponse } from "@/lib/api/auth";

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  category: z.enum(["religious", "national", "cultural", "personal"]).optional(),
  emoji: z.string().optional(),
  color: z.string().optional(),
  target_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  savings_start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  savings_end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  suggested_frequency: z.enum(["daily", "weekly", "monthly"]).optional(),
  is_active: z.boolean().optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const { id } = await params;
    let body: unknown;
    try { body = await request.json(); } catch { return badRequestResponse("Invalid JSON."); }

    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return badRequestResponse(parsed.error.issues[0]?.message ?? "Validation failed.");
    }

    const { data, error } = await auth.supabase
      .from("festive_periods")
      .update(parsed.data)
      .eq("id", id)
      .select()
      .single();

    if (error) return badRequestResponse(error.message);
    return NextResponse.json({ data });
  } catch {
    return serverErrorResponse();
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const { id } = await params;

    const { error } = await auth.supabase
      .from("festive_periods")
      .delete()
      .eq("id", id);

    if (error) return badRequestResponse(error.message);
    return NextResponse.json({ data: { deleted: true } });
  } catch {
    return serverErrorResponse();
  }
}
