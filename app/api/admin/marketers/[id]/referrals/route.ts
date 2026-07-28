import { NextResponse } from "next/server";
import { badRequestResponse, requireAdmin, serverErrorResponse } from "@/lib/api/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type Context = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: Context) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const { id } = await context.params;
    const url = new URL(request.url);
    const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
    const pageSize = Math.min(500, Math.max(1, Number(url.searchParams.get("pageSize") ?? 100)));
    const statusFilter = url.searchParams.get("status") ?? "all"; // all | attributed | pending

    const adminSupabase = createSupabaseAdminClient();

    const { data: marketer, error: marketerError } = await adminSupabase
      .from("marketers")
      .select("id, name, referral_code")
      .eq("id", id)
      .maybeSingle();

    if (marketerError) return badRequestResponse(marketerError.message);
    if (!marketer) return NextResponse.json({ error: "Marketer not found." }, { status: 404 });

    // Attributed: marketer_id set. Pending: used this code but not yet attributed (awaiting passbook).
    const [attributedResult, pendingResult] = await Promise.all([
      adminSupabase
        .from("profiles")
        .select(
          "id, name, email, phone, status, referral_code_used, marketer_id, passbook_activated, passbook_activated_at, created_at",
        )
        .eq("marketer_id", id)
        .order("created_at", { ascending: false }),
      adminSupabase
        .from("profiles")
        .select(
          "id, name, email, phone, status, referral_code_used, marketer_id, passbook_activated, passbook_activated_at, created_at",
        )
        .eq("referral_code_used", marketer.referral_code)
        .is("marketer_id", null)
        .order("created_at", { ascending: false }),
    ]);

    if (attributedResult.error) return badRequestResponse(attributedResult.error.message);
    if (pendingResult.error) return badRequestResponse(pendingResult.error.message);

    const attributed = (attributedResult.data ?? []).map((row) => ({
      ...row,
      attribution_status: "attributed" as const,
    }));

    const pending = (pendingResult.data ?? []).map((row) => ({
      ...row,
      attribution_status: "pending" as const,
    }));

    let combined = [...attributed, ...pending].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );

    if (statusFilter === "attributed") {
      combined = combined.filter((row) => row.attribution_status === "attributed");
    } else if (statusFilter === "pending") {
      combined = combined.filter((row) => row.attribution_status === "pending");
    }

    const total = combined.length;
    const from = (page - 1) * pageSize;
    const data = combined.slice(from, from + pageSize);

    return NextResponse.json({
      data,
      counts: {
        attributed: attributed.length,
        pending: pending.length,
        total: attributed.length + pending.length,
      },
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
    });
  } catch (error) {
    return serverErrorResponse(error);
  }
}
