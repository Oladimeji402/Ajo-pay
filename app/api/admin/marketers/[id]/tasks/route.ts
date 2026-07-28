import { NextResponse } from "next/server";
import { z } from "zod";
import { badRequestResponse, requireAdmin, serverErrorResponse } from "@/lib/api/auth";
import { logAdminAction } from "@/lib/admin-audit";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const createSchema = z.object({
  title: z.string().min(2),
  description: z.string().default(""),
  dueAt: z.string().datetime().optional().nullable(),
});

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const { id } = await context.params;
    const adminSupabase = createSupabaseAdminClient();

    const { data: marketer } = await adminSupabase
      .from("marketers")
      .select("id")
      .eq("id", id)
      .maybeSingle();

    if (!marketer) return NextResponse.json({ error: "Marketer not found." }, { status: 404 });

    const { data, error } = await adminSupabase
      .from("marketer_tasks")
      .select("*")
      .eq("marketer_id", id)
      .order("created_at", { ascending: false });

    if (error) return badRequestResponse(error.message);
    return NextResponse.json({ data: data ?? [] });
  } catch (error) {
    return serverErrorResponse(error);
  }
}

export async function POST(request: Request, context: Context) {
  try {
    const auth = await requireAdmin();
    if (auth.error || !auth.user) return auth.error;

    const { id } = await context.params;
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return badRequestResponse("Invalid JSON.");
    }

    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return badRequestResponse(parsed.error.issues[0]?.message ?? "Validation failed.");
    }

    const adminSupabase = createSupabaseAdminClient();
    const { data: marketer } = await adminSupabase
      .from("marketers")
      .select("id, status")
      .eq("id", id)
      .maybeSingle();

    if (!marketer) return NextResponse.json({ error: "Marketer not found." }, { status: 404 });

    const { data, error } = await adminSupabase
      .from("marketer_tasks")
      .insert({
        marketer_id: id,
        title: parsed.data.title.trim(),
        description: parsed.data.description?.trim() || "",
        due_at: parsed.data.dueAt || null,
        created_by: auth.user.id,
        status: "open",
      })
      .select()
      .single();

    if (error) return badRequestResponse(error.message);

    await logAdminAction({
      adminId: auth.user.id,
      action: "marketer.task_create",
      targetType: "marketer_task",
      targetId: data.id,
      after: data as Record<string, unknown>,
      metadata: { marketer_id: id },
    });

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return serverErrorResponse(error);
  }
}
