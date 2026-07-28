import { NextResponse } from "next/server";
import { z } from "zod";
import { badRequestResponse, requireUser, serverErrorResponse } from "@/lib/api/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const updateSchema = z.object({
  status: z.enum(["open", "in_progress", "done"]),
});

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  try {
    const auth = await requireUser();
    if (auth.error || !auth.user) return auth.error;

    const { id } = await context.params;
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return badRequestResponse("Invalid JSON.");
    }

    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return badRequestResponse(parsed.error.issues[0]?.message ?? "Validation failed.");
    }

    const adminSupabase = createSupabaseAdminClient();
    const { data: marketer } = await adminSupabase
      .from("marketers")
      .select("id, status")
      .eq("user_id", auth.user.id)
      .maybeSingle();

    if (!marketer || marketer.status !== "active") {
      return NextResponse.json({ error: "Your account is not approved yet." }, { status: 403 });
    }

    const { data: task } = await adminSupabase
      .from("marketer_tasks")
      .select("id, marketer_id, status")
      .eq("id", id)
      .eq("marketer_id", marketer.id)
      .maybeSingle();

    if (!task) return NextResponse.json({ error: "Task not found." }, { status: 404 });
    if (task.status === "cancelled") {
      return badRequestResponse("Cancelled tasks cannot be updated.");
    }

    const { data, error } = await adminSupabase
      .from("marketer_tasks")
      .update({ status: parsed.data.status })
      .eq("id", id)
      .select()
      .single();

    if (error) return badRequestResponse(error.message);
    return NextResponse.json({ data });
  } catch (error) {
    return serverErrorResponse(error);
  }
}
