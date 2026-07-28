import { NextResponse } from "next/server";
import { z } from "zod";
import { badRequestResponse, requireAdmin, serverErrorResponse } from "@/lib/api/auth";
import { logAdminAction } from "@/lib/admin-audit";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const assignSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters."),
  description: z.string().default(""),
  dueAt: z.string().optional().nullable(),
  marketerIds: z.array(z.string().uuid()).min(1, "Select at least one marketer."),
});

/** Assign the same task to one or many marketers. */
export async function POST(request: Request) {
  try {
    const auth = await requireAdmin();
    if (auth.error || !auth.user) return auth.error;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return badRequestResponse("Invalid JSON.");
    }

    const parsed = assignSchema.safeParse(body);
    if (!parsed.success) {
      return badRequestResponse(parsed.error.issues[0]?.message ?? "Validation failed.");
    }

    const uniqueIds = [...new Set(parsed.data.marketerIds)];
    const adminSupabase = createSupabaseAdminClient();

    const { data: marketers, error: marketersError } = await adminSupabase
      .from("marketers")
      .select("id, name, status")
      .in("id", uniqueIds);

    if (marketersError) return badRequestResponse(marketersError.message);
    if (!marketers || marketers.length === 0) {
      return badRequestResponse("No valid marketers selected.");
    }
    if (marketers.length !== uniqueIds.length) {
      return badRequestResponse("One or more selected marketers were not found.");
    }

    const inactive = marketers.filter((m) => m.status !== "active");
    if (inactive.length > 0) {
      return badRequestResponse(
        `Only approved (active) marketers can receive tasks. Inactive selection: ${inactive.map((m) => m.name).join(", ")}`,
      );
    }

    const dueAt = parsed.data.dueAt?.trim() ? parsed.data.dueAt.trim() : null;
    const rows = marketers.map((m) => ({
      marketer_id: m.id,
      title: parsed.data.title.trim(),
      description: parsed.data.description?.trim() || "",
      due_at: dueAt,
      created_by: auth.user!.id,
      status: "open" as const,
    }));

    const { data, error } = await adminSupabase
      .from("marketer_tasks")
      .insert(rows)
      .select("id, marketer_id, title, status, created_at");

    if (error) return badRequestResponse(error.message);

    await logAdminAction({
      adminId: auth.user.id,
      action: "marketer.tasks_bulk_assign",
      targetType: "marketer_task",
      targetId: data?.[0]?.id ?? uniqueIds[0],
      after: {
        title: parsed.data.title.trim(),
        marketer_ids: uniqueIds,
        count: data?.length ?? 0,
      },
    });

    return NextResponse.json({
      data: {
        assigned: data?.length ?? 0,
        tasks: data ?? [],
      },
    }, { status: 201 });
  } catch (error) {
    return serverErrorResponse(error);
  }
}

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
    const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get("pageSize") ?? 50)));
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const adminSupabase = createSupabaseAdminClient();
    let query = adminSupabase
      .from("marketer_tasks")
      .select("*, marketers(id, name, referral_code, status)", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (status && ["open", "in_progress", "done", "cancelled"].includes(status)) {
      query = query.eq("status", status);
    }

    const { data, error, count } = await query;
    if (error) return badRequestResponse(error.message);

    return NextResponse.json({
      data: data ?? [],
      pagination: {
        page,
        pageSize,
        total: count ?? 0,
        totalPages: Math.max(1, Math.ceil((count ?? 0) / pageSize)),
      },
    });
  } catch (error) {
    return serverErrorResponse(error);
  }
}
